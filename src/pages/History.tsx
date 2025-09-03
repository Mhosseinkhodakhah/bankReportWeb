import { memo, useCallback, useEffect, useMemo, useState } from "react";
import styles from "./History.module.css";
import {
  RetrySVG,
  DownloadedSVG,
  ChevronLeftSVG,
  ChevronRightSVG,
  CloseSVG,
  FolderSVG,
  DocumentSVG,
  UploadedSVG,
  UnknownSVG,
  SuccessSVG,
  DangerSVG,
  ErrorSVG,
} from "../assets/svgs";
import {
  getUploadStatusHistory,
  processFilesAgain,
  getUploadStatusHistoryItem,
} from "../api/uploadService";
import { API_BASE_URL, API_ENDPOINTS } from "../api/config";
import type { UploadStatusHistoryItemResponse } from "../api/types";
import Loading from "../components/Loading";
import { useLoading } from "../hooks/useLoading";

interface ProcessingRecord {
  id: string;
  fileName: string;
  date: string;
  time: string;
  status: "pending" | "finished" | "failed";
}

type BackendHistory = {
  id?: string;
  _id?: string;
  uploadStatusId?: string;
  fileName?: string;
  name?: string;
  date?: string;
  createdAt?: string;
  status?: string;
  time?: string;
};

function HistoryPage() {
  const { loading, execute } = useLoading();
  const [processingHistory, setProcessingHistory] = useState<
    ProcessingRecord[]
  >([]);

  const [page, setPage] = useState<number>(1);
  const limit = 10;

  const [showRetryModal, setShowRetryModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showUploadsModal, setShowUploadsModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ProcessingRecord | null>(
    null
  );
  const [resultFiles, setResultFiles] = useState<
    { id: string; name: string }[]
  >([]);
  const [userUploads, setUserUploads] = useState<
    { id: string; name: string }[]
  >([]);
  const [adminUploads, setAdminUploads] = useState<
    { id: string; name: string }[]
  >([]);

  const skip = useMemo(() => String((page - 1) * limit), [page, limit]);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      await execute(async () => {
        const history = await getUploadStatusHistory(skip, String(limit), {
          signal: controller.signal,
        });

        const items: ProcessingRecord[] = (history.data || []).map(
          (h: BackendHistory) => ({
            id: h._id || h.id || h.uploadStatusId || "",
            fileName: h._id || "-",
            date: (h.createdAt || h.date || "").toString(),
            time: "",
            status: (h.status === "finished"
              ? "finished "
              : h.status === "failed"
              ? "failed"
              : h.status || "pending") as ProcessingRecord["status"],
          })
        );
        setProcessingHistory(items);
      });
    })();
    return () => {
      controller.abort();
    };
  }, [skip, limit, execute]);

  const getStatusText = useCallback((status: string) => {
    switch (status.trim()) {
      case "finished":
        return "پردازش شده";
      case "pending":
        return "در حال پردازش";
      case "failed":
        return "خطا در پردازش";
      default:
        return status;
    }
  }, []);

  const formatJalaliDateTime = useCallback((dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const datePart = d.toLocaleDateString("fa-IR-u-ca-persian-nu-latn");
    const timePart = d.toLocaleTimeString("fa-IR-u-ca-persian-nu-latn", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${datePart} - ${timePart}`;
  }, []);

  const getStatusClass = useCallback((status: string) => {
    switch (status.trim()) {
      case "pending":
        return styles.statusProcessing;
      case "failed":
        return styles.statusError;
      case "finished":
        return styles.statusCompleted;
      default:
        return "";
    }
  }, []);

  const handleRetry = useCallback((record: ProcessingRecord) => {
    setSelectedRecord(record);
    setShowRetryModal(true);
  }, []);

  const handleDownload = useCallback(async (record: ProcessingRecord) => {
    setSelectedRecord(record);
    try {
      const detail: UploadStatusHistoryItemResponse =
        await getUploadStatusHistoryItem(record.id);
      const files = Array.isArray(detail?.data?.resultFiles)
        ? detail.data.resultFiles
        : [];
      const mapped = files.map((f) => ({
        id: String(f?._id || ""),
        name: String(f?.fileName || "فایل"),
      }));
      setResultFiles(mapped);
    } catch {
      setResultFiles([]);
    } finally {
      setShowDownloadModal(true);
    }
  }, []);

  const handleShowUploads = useCallback(async (record: ProcessingRecord) => {
    setSelectedRecord(record);
    try {
      const detail: UploadStatusHistoryItemResponse =
        await getUploadStatusHistoryItem(record.id);
      const users = Array.isArray(detail?.data?.userUploads)
        ? detail.data.userUploads
        : [];
      const admins = Array.isArray(detail?.data?.adminUploads)
        ? detail.data.adminUploads
        : [];
      setUserUploads(
        users.map((u) => ({ id: String(u._id), name: String(u.savedAs) }))
      );
      setAdminUploads(
        admins.map((a) => ({ id: String(a._id), name: String(a.savedAs) }))
      );
    } catch {
      setUserUploads([]);
      setAdminUploads([]);
    } finally {
      setShowUploadsModal(true);
    }
  }, []);

  const openDownload = useCallback(
    async (fileId?: string, fileName?: string) => {
      if (!fileId) return;
      const url = `${API_BASE_URL}${API_ENDPOINTS.UPLOADS.GET_FILE(fileId)}`;
      const token = localStorage.getItem("auth_token");
      try {
        const response = await fetch(url, {
          method: "GET",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!response.ok) throw new Error("دانلود فایل ناموفق بود");
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = objectUrl;
        link.download = fileName || "file";
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(objectUrl);
      } catch (e) {
        console.error(e);
      }
    },
    []
  );

  const confirmRetry = useCallback(async () => {
    if (!selectedRecord) return;
    try {
      await processFilesAgain(selectedRecord.id);
      setShowRetryModal(false);
      setSelectedRecord(null);

      const refreshed = await getUploadStatusHistory(skip, String(limit));
      const items: ProcessingRecord[] = (refreshed.data || []).map(
        (h: BackendHistory) => ({
          id: h.id || h._id || h.uploadStatusId || "",
          fileName: h.fileName || h.name || "-",
          date: h.date || h.createdAt || "",
          time: h.time || "",
          status: (h.status || "pending") as ProcessingRecord["status"],
        })
      );
      setProcessingHistory(items);
    } catch {
      console.error("Failed to load processing history");
    }
  }, [selectedRecord, skip, limit]);

  return (
    <div className={styles.historyContainer}>
      <main className={styles.mainContent}>
        <h1 className={styles.pageTitle}>تاریخچه پردازشها</h1>

        <div className={styles.historyTable}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>شناسه</th>
                <th>تاریخ</th>
                <th>زمان</th>
                <th>وضعیت</th>
                <th>فعالیت ها</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className={styles.loadingCell}>
                    <Loading
                      variant="inline"
                      message="در حال بارگذاری..."
                      size="medium"
                      className={styles.loading}
                    />
                  </td>
                </tr>
              ) : (
                processingHistory.map((record) => (
                  <tr key={record.id}>
                    <td>{record.fileName}</td>
                    <td>{new Date(record.date).toLocaleDateString("fa-IR")}</td>
                    <td>{new Date(record.date).toLocaleTimeString("fa-IR")}</td>
                    <td>
                      <span
                        className={`${styles.statusBadge} ${getStatusClass(
                          record.status
                        )}`}
                      >
                        {getStatusText(record.status)}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionButtons}>
                        {record.status === "pending" ||
                          (record.status === "failed" && (
                            <button
                              onClick={() => handleRetry(record)}
                              className={styles.retryButton}
                              title="تلاش مجدد"
                            >
                              <RetrySVG />
                            </button>
                          ))}
                        <button
                          onClick={() => handleDownload(record)}
                          className={styles.downloadButton}
                          title="دانلود"
                        >
                          <DownloadedSVG width={24} height={24} />
                        </button>
                        <button
                          onClick={() => handleShowUploads(record)}
                          className={styles.downloadButton}
                          title="فایل‌های آپلود شده"
                        >
                          <UploadedSVG />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className={styles.pagination}>
          <button
            className={styles.paginationButton}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronRightSVG />
          </button>
          <button className={`${styles.paginationButton} ${styles.active}`}>
            {page}
          </button>
          <button
            className={styles.paginationButton}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronLeftSVG />
          </button>
        </div>
      </main>

      {showRetryModal && selectedRecord && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                <RetrySVG />
                تلاش مجدد
              </h3>
              <button
                onClick={() => setShowRetryModal(false)}
                className={styles.closeButton}
              >
                <CloseSVG />
              </button>
            </div>
            <div className={styles.modalContent}>
              <p className={styles.modalTimestamp}>
                {formatJalaliDateTime(selectedRecord.date)}
              </p>
              <p className={styles.modalQuestion}>
                آیا مطمئن هستید که میخواهید این پردازش را دوباره اجرا کنید؟
              </p>
            </div>
            <div className={styles.modalActions}>
              <button
                onClick={() => setShowRetryModal(false)}
                className={styles.cancelButton}
              >
                انصراف
              </button>
              <button
                onClick={confirmRetry}
                className={styles.retryConfirmButton}
              >
                اجرای مجدد پردازش
              </button>
            </div>
          </div>
        </div>
      )}

      {showDownloadModal && selectedRecord && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                <DownloadedSVG />
                دانلود گزارشات
              </h3>
              <button
                onClick={() => setShowDownloadModal(false)}
                className={styles.closeButton}
              >
                <CloseSVG />
              </button>
            </div>
            <div className={styles.modalContent}>
              <p className={styles.modalTimestamp}>
                {formatJalaliDateTime(selectedRecord.date)}
              </p>
              <div className={styles.reportCategories}>
                {resultFiles.map((rf) => {
                  let icon = <DownloadedSVG />;

                  if (rf.name === "گزارشات نامشخص") {
                    icon = <UnknownSVG />;
                  } else if (rf.name === "گزارشات تکراری") {
                    icon = <RetrySVG />;
                  } else if (rf.name === "گزارشات تایید شده") {
                    icon = <SuccessSVG className={styles.successIcon} />;
                  } else if (rf.name === "گزارشات دارای مغایرت") {
                    icon = <DangerSVG />;
                  } else if (rf.name === "گزارشات تایید نشده") {
                    icon = <ErrorSVG className={styles.errorIcon} />;
                  } else if (rf.name === "همه گزارش ها") {
                    icon = <FolderSVG />;
                  }

                  return (
                    <div key={rf.id} className={styles.reportCategory}>
                      <div className={styles.reportIcon}>{icon}</div>
                      <span>{rf.name}</span>
                      <button
                        className={styles.downloadReportButton}
                        onClick={() => openDownload(rf.id, rf.name)}
                        disabled={!rf.id}
                      >
                        دانلود
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className={styles.modalActions}>
              <button
                onClick={() => setShowDownloadModal(false)}
                className={styles.exitButton}
              >
                خروج
              </button>
            </div>
          </div>
        </div>
      )}

      {showUploadsModal && selectedRecord && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                <UploadedSVG />
                فایل‌های آپلود شده
              </h3>
              <button
                onClick={() => setShowUploadsModal(false)}
                className={styles.closeButton}
              >
                <CloseSVG />
              </button>
            </div>
            <div className={styles.modalContent}>
              <p className={styles.modalTimestamp}>
                {formatJalaliDateTime(selectedRecord.date)}
              </p>
              <div className={styles.reportCategories}>
                {userUploads.length ? (
                  <div className={styles.reportCategory}>
                    <div className={styles.reportIcon}>
                      <FolderSVG />
                    </div>
                    <span>فایل‌های اکسل حسابداری</span>
                  </div>
                ) : null}
                {userUploads.map((f) => (
                  <div key={`u-${f.id}`} className={styles.reportCategory}>
                    <div className={styles.reportIcon}>
                      <DocumentSVG />
                    </div>
                    <span>{f.name}</span>
                    <button
                      className={styles.downloadReportButton}
                      onClick={() => openDownload(f.id, f.name)}
                      disabled={!f.id}
                    >
                      دانلود
                    </button>
                  </div>
                ))}

                {adminUploads.length ? (
                  <div className={styles.reportCategory}>
                    <div className={styles.reportIcon}>
                      <FolderSVG />
                    </div>
                    <span>فایل‌های اکسل بانک</span>
                  </div>
                ) : null}
                {adminUploads.map((f) => (
                  <div key={`a-${f.id}`} className={styles.reportCategory}>
                    <div className={styles.reportIcon}>
                      <DocumentSVG />
                    </div>
                    <span>{f.name}</span>
                    <button
                      className={styles.downloadReportButton}
                      onClick={() => openDownload(f.id, f.name)}
                      disabled={!f.id}
                    >
                      دانلود
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.modalActions}>
              <button
                onClick={() => setShowUploadsModal(false)}
                className={styles.exitButton}
              >
                خروج
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(HistoryPage);

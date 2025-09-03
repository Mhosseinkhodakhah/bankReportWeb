import { memo, useCallback, useEffect, useMemo, useState, useRef } from "react";
import {
  uploadExcels,
  processFiles as processFilesAPI,
} from "../api/uploadService";
import styles from "./Dashboard.module.css";
import { useToast } from "../components/toast-context";
import { PlusSVG, TrashSVG, DocumentSVG, DownloadSVG } from "../assets/svgs";
import Loading from "../components/Loading";
import { useMultipleLoading } from "../hooks/useLoading";

type UploadState = {
  files: File[];
  status: "idle" | "uploading" | "success" | "error";
  error?: string;
  uploadId?: string;
};

type BankType = "meli" | "keshavarzi" | "keshavarzi_periodic" | "saderat";

function DashboardPage() {
  const { showToast } = useToast();
  const { execute, isLoading } = useMultipleLoading(["upload", "process"]);
  const [bank, setBank] = useState<UploadState>({ files: [], status: "idle" });
  const [acc, setAcc] = useState<UploadState>({ files: [], status: "idle" });
  const [version, setVersion] = useState<string>("");
  const [action, setAction] = useState<
    "idle" | "uploading" | "ready" | "processing"
  >("idle");
  const [downloadUrl, setDownloadUrl] = useState<string>("");
  const [isDragging, setIsDragging] = useState<"bank" | "acc" | null>(null);
  const [bankType, setBankType] = useState<BankType | "">("");

  const bankDropRef = useRef<HTMLDivElement>(null);
  const accDropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
    };
  }, [downloadUrl]);

  const canSubmit = useMemo(
    () => bank.files.length > 0 && acc.files.length > 0 && bankType !== "",
    [bank.files.length, acc.files.length, bankType]
  );

  const isBankTypeDisabled = useMemo(
    () =>
      action === "uploading" || action === "ready" || action === "processing",
    [action]
  );

  const validateExcelFiles = useCallback(
    (files: File[]): File[] => {
      const excelExtensions = [".xlsx", ".xls"];
      const validFiles = files.filter((file) => {
        const extension = file.name
          .toLowerCase()
          .substring(file.name.lastIndexOf("."));
        return excelExtensions.includes(extension);
      });

      if (validFiles.length !== files.length) {
        showToast("error", "فقط فایل‌های اکسل (.xlsx, .xls) مجاز هستند");
      }

      return validFiles;
    },
    [showToast]
  );

  const mergeUniqueFiles = useCallback((existing: File[], incoming: File[]) => {
    const byKey = new Map<string, File>();
    const makeKey = (f: File) => `${f.name}__${f.size}__${f.lastModified}`;
    existing.forEach((f) => byKey.set(makeKey(f), f));
    incoming.forEach((f) => byKey.set(makeKey(f), f));
    return Array.from(byKey.values());
  }, []);

  const handleFileSelect = useCallback(
    (which: "bank" | "acc") => (e: React.ChangeEvent<HTMLInputElement>) => {
      const list = Array.from(e.target.files || []);
      const validFiles = validateExcelFiles(list);
      if (which === "bank") {
        setBank((prev) => ({
          ...prev,
          files: mergeUniqueFiles(prev.files, validFiles),
          status: "idle",
        }));
      } else {
        setAcc((prev) => ({
          ...prev,
          files: mergeUniqueFiles(prev.files, validFiles),
          status: "idle",
        }));
      }

      setVersion("");
      setAction("idle");
     
      e.currentTarget.value = "";
    },
    [validateExcelFiles, mergeUniqueFiles]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent, which: "bank" | "acc") => {
      e.preventDefault();
      setIsDragging(which);
    },
    []
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, which: "bank" | "acc") => {
      e.preventDefault();
      setIsDragging(null);

      const files = Array.from(e.dataTransfer.files);
      const validFiles = validateExcelFiles(files);
      if (which === "bank") {
        setBank((prev) => ({
          ...prev,
          files: mergeUniqueFiles(prev.files, validFiles),
          status: "idle",
        }));
      } else {
        setAcc((prev) => ({
          ...prev,
          files: mergeUniqueFiles(prev.files, validFiles),
          status: "idle",
        }));
      }

      setVersion("");
      setAction("idle");
    },
    [validateExcelFiles, mergeUniqueFiles]
  );

  const handleUploadOnly = useCallback(async () => {
    if (!canSubmit) return;
    setAction("uploading");
    setDownloadUrl("");

    await execute("upload", async () => {
      const bankCurrent = bank;
      const accCurrent = acc;

      if (bankCurrent.files.length === 0 || accCurrent.files.length === 0) {
        showToast("error", "لطفاً فایل‌هایی را انتخاب کنید");
        return;
      }

      if (!bankType) {
        showToast("error", "لطفاً نوع بانک را انتخاب کنید");
        return;
      }

      setBank({ ...bankCurrent, status: "uploading", error: undefined });
      setAcc({ ...accCurrent, status: "uploading", error: undefined });

      const uploadRes = await uploadExcels(
        accCurrent.files,
        bankCurrent.files,
        bankType as BankType
      );

      setBank({
        ...bankCurrent,
        status: "success",
        uploadId: uploadRes.data.adminFiles?.[0]?.uploader || "",
      });
      setAcc({
        ...accCurrent,
        status: "success",
        uploadId: uploadRes.data.userFiles?.[0]?.uploader || "",
      });

      setVersion(uploadRes.data.version);
      setAction("ready");
      showToast(
        "success",
        "آپلود فایل‌های اکسل با موفقیت انجام شد. برای پردازش کلیک کنید."
      );
    }).catch((error) => {
      console.error("Upload flow failed:", error);
      setAction("idle");
      showToast("error", "آپلود فایل‌های اکسل انجام نشد!");
    });
  }, [canSubmit, bank, acc, bankType, showToast, execute]);

  const handleProcessOnly = useCallback(async () => {
    if (!version) return;
    setAction("processing");

    await execute("process", async () => {
      if (!bankType) {
        showToast("error", "نوع بانک مشخص نشده است");
        return;
      }

      const result = await processFilesAPI(version, bankType as BankType);
      if (result.data.uploadStatusId) {
        localStorage.setItem("lastUploadStatusId", result.data.uploadStatusId);
      }
      showToast("success", "پردازش فایل‌ها آغاز شد.");
    }).catch((error) => {
      console.error("Process flow failed:", error);
      showToast("error", "آغاز پردازش ناموفق بود!");
      setAction("ready");
    });
  }, [version, bankType, showToast, execute]);

  const removeFile = useCallback(
    (which: "bank" | "acc", index: number) => {
      const current = which === "bank" ? bank : acc;
      const set = which === "bank" ? setBank : setAcc;
      const newFiles = current.files.filter((_, i) => i !== index);
      set({ ...current, files: newFiles, status: "idle" });
    },
    [bank, acc]
  );

  return (
    <div className={styles.dashboardContainer}>
      <main className={styles.mainContent}>
        <div className={styles.pageTitleContainer}>
          <h1 className={styles.pageTitle}>آپلود فایل ها</h1>
          <div className={styles.bankTypeSection}>
            <select
              className={styles.bankTypeSelect}
              value={bankType}
              onChange={(e) => setBankType(e.target.value as BankType | "")}
              disabled={isBankTypeDisabled}
              required
            >
              <option value="">انتخاب نوع بانک</option>
              <option value="meli">ملی</option>
              <option value="keshavarzi">کشاورزی</option>
              <option value="keshavarzi_periodic">کشاورزی دوره‌ای</option>
              <option value="saderat">صادرات</option>
            </select>
          </div>
        </div>

        <div className={styles.uploadSections}>
          <div className={styles.uploadSection}>
            <div className={styles.sectionContent}>
              <h3 className={styles.sectionTitle}>فایل اکسل بانک</h3>
              <button
                className={`${styles.addFileButton} ${
                  bank.files.length > 0 ? styles.addFileButtonHasFiles : ""
                }`}
                onClick={() =>
                  document.getElementById("bank-file-input")?.click()
                }
              >
                <PlusSVG />
                انتخاب فایل
              </button>
            </div>
            <input
              id="bank-file-input"
              type="file"
              multiple
              accept=".xlsx,.xls"
              onChange={handleFileSelect("bank")}
              style={{ display: "none" }}
            />

            <div
              ref={bankDropRef}
              className={`${styles.dropZone} ${
                isDragging === "bank" ? styles.dragging : ""
              }`}
              onDragOver={(e) => handleDragOver(e, "bank")}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, "bank")}
            >
              <span>فایل را بکشید و اینجا رها کنید.</span>
            </div>

            {bank.files.length > 0 && (
              <div className={styles.fileList}>
                {bank.files.map((file, index) => (
                  <div key={index} className={styles.fileItem}>
                    <DocumentSVG className={styles.fileIcon} />

                    <span className={styles.fileName}>{file.name}</span>
                    <button
                      className={styles.deleteButton}
                      onClick={() => removeFile("bank", index)}
                    >
                      <TrashSVG />
                      حذف
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.uploadSection}>
            <div className={styles.sectionContent}>
              <h3 className={styles.sectionTitle}>فایل اکسل حسابداری</h3>
              <button
                className={`${styles.addFileButton} ${
                  acc.files.length > 0 ? styles.addFileButtonHasFiles : ""
                }`}
                onClick={() =>
                  document.getElementById("acc-file-input")?.click()
                }
              >
                <PlusSVG />
                انتخاب فایل
              </button>
            </div>
            <input
              id="acc-file-input"
              type="file"
              multiple
              accept=".xlsx,.xls"
              onChange={handleFileSelect("acc")}
              style={{ display: "none" }}
            />

            <div
              ref={accDropRef}
              className={`${styles.dropZone} ${
                isDragging === "acc" ? styles.dragging : ""
              }`}
              onDragOver={(e) => handleDragOver(e, "acc")}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, "acc")}
            >
              <span>فایل را بکشید و اینجا رها کنید.</span>
            </div>

            {acc.files.length > 0 && (
              <div className={styles.fileList}>
                {acc.files.map((file, index) => (
                  <div key={index} className={styles.fileItem}>
                    <DocumentSVG />
                    <span className={styles.fileName}>{file.name}</span>

                    <button
                      className={styles.deleteButton}
                      onClick={() => removeFile("acc", index)}
                    >
                      <TrashSVG />
                      حذف
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {canSubmit ? (
          <div className={styles.uploadButtonContainer}>
            <button
              className={styles.uploadButton}
              onClick={
                action === "ready" ? handleProcessOnly : handleUploadOnly
              }
              disabled={isLoading("upload") || isLoading("process")}
            >
              {isLoading("upload") || isLoading("process") ? (
                <Loading
                  variant="button"
                  message={
                    isLoading("upload") ? "در حال آپلود..." : "در حال پردازش..."
                  }
                  size="small"
                />
              ) : (
                <>
                  <DownloadSVG />
                  {action === "ready" ? "شروع پردازش" : "آپلود فایل ها"}
                </>
              )}
            </button>
          </div>
        ) : null}
      </main>
    </div>
  );
}

export default memo(DashboardPage);

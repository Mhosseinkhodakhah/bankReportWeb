import { memo, useCallback, useEffect, useState, useRef } from "react";
import {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../api/userService.ts";
import type {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  UserRole,
} from "../api/types";
import styles from "./Admin.module.css";
import {
  UserAddSVG,
  EditSVG,
  TrashSVG,
  ChevronLeftSVG,
  ChevronRightSVG,
  CloseSVG,
  EyeOffSVG,
  EyeSVG,
} from "../assets/svgs";
import { useToast } from "../components/toast-context";
import Loading from "../components/Loading";
import { useLoading } from "../hooks/useLoading";

const getErrorMessage = (error: unknown, fallbackMessage: string): string => {
  if (error && typeof error === "object") {
    const err = error as {
      response?: {
        data?:
          | {
              message?: string;
              error?: string;
              errors?: string[];
            }
          | string;
      };
      message?: string;
      error?: string;
    };

    if (err.response?.data) {
      if (typeof err.response.data === "object") {
        if (err.response.data.message) {
          return err.response.data.message;
        }
        if (err.response.data.error) {
          return err.response.data.error;
        }
        if (
          err.response.data.errors &&
          Array.isArray(err.response.data.errors)
        ) {
          return err.response.data.errors.join(", ");
        }
      } else if (typeof err.response.data === "string") {
        return err.response.data;
      }
    }

    if (err.message) {
      return err.message;
    }

    if (err.error) {
      return err.error;
    }
  }

  return fallbackMessage;
};

function AdminPage() {
  const { showToast } = useToast();
  const { loading, execute } = useLoading();
  const [users, setUsers] = useState<User[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const hasLoaded = useRef(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [usersPerPage] = useState(10);
  const [newUser, setNewUser] = useState<CreateUserRequest>({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    password: "",
    role: "admin",
    isActive: true,
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [editUser, setEditUser] = useState<UpdateUserRequest>({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    password: "",
    role: "admin",
    isActive: true,
  });
  const [editConfirmPassword, setEditConfirmPassword] = useState("");
  const [formErrors, setFormErrors] = useState<{
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [showEditConfirmPassword, setShowEditConfirmPassword] = useState(false);

  const loadUsers = useCallback(
    async (page = currentPage) => {
      await execute(async () => {
        const result = await getAllUsers(page, usersPerPage);
        setUsers(result.users);
        setTotalPages(result.pagination.totalPages);
        setTotalUsers(result.pagination.total);
        setCurrentPage(result.pagination.page);
      }).catch((error) => {
        console.error("Failed to load users:", error);
        const errorMessage = getErrorMessage(
          error,
          "خطا در بارگذاری لیست کاربران"
        );
        showToast("error", errorMessage);
      });
    },
    [currentPage, usersPerPage, showToast, execute]
  );

  const validateForm = useCallback(
    (
      userData: CreateUserRequest | UpdateUserRequest,
      confirmPass: string,
      isEdit = false
    ) => {
      const errors: typeof formErrors = {};

      if (!userData.firstName?.trim()) {
        errors.firstName = "نام الزامی است";
      }

      if (!userData.lastName?.trim()) {
        errors.lastName = "نام خانوادگی الزامی است";
      }

      if (!userData.phoneNumber?.trim()) {
        errors.phoneNumber = "شماره موبایل الزامی است";
      } else if (
        userData.phoneNumber &&
        !/^09\d{9}$/.test(userData.phoneNumber)
      ) {
        errors.phoneNumber = "شماره موبایل باید با 09 شروع شده و 11 رقم باشد";
      }

      if (!isEdit && !userData.password) {
        errors.password = "رمز عبور الزامی است";
      } else if (userData.password && userData.password.length < 8) {
        errors.password = "رمز عبور باید حداقل 8 کارکتر باشد";
      }

      if (!isEdit && userData.password && userData.password !== confirmPass) {
        errors.confirmPassword = "رمز عبور و تکرار آن مطابقت ندارند";
      }

      if (isEdit && userData.password && userData.password !== confirmPass) {
        errors.confirmPassword = "رمز عبور و تکرار آن مطابقت ندارند";
      }

      setFormErrors(errors);
      return Object.keys(errors).length === 0;
    },
    []
  );

  useEffect(() => {
    if (!hasLoaded.current) {
      hasLoaded.current = true;
      loadUsers();
    }
  }, [loadUsers]);

  const handleAddUser = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateForm(newUser, confirmPassword, false)) {
        showToast("error", "لطفاً خطاهای فرم را برطرف کنید");
        return;
      }

      try {
        await createUser(newUser);
        setNewUser({
          firstName: "",
          lastName: "",
          phoneNumber: "",
          password: "",
          role: "admin",
          isActive: true,
        });
        setConfirmPassword("");
        setFormErrors({});
        setShowAddForm(false);
        showToast("success", "کاربر با موفقیت اضافه شد");
        loadUsers();
      } catch (error: unknown) {
        console.error("Failed to add user:", error);
        const errorMessage = getErrorMessage(error, "خطا در اضافه کردن کاربر");
        showToast("error", errorMessage);
      }
    },
    [newUser, confirmPassword, showToast, validateForm, loadUsers]
  );

  const handleEditUser = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateForm(editUser, editConfirmPassword, true)) {
        showToast("error", "لطفاً خطاهای فرم را برطرف کنید");
        return;
      }

      try {
        if (selectedUser) {
          await updateUser(selectedUser.id, editUser);
        }
        setEditConfirmPassword("");
        setFormErrors({});
        setShowEditForm(false);
        setSelectedUser(null);
        showToast("success", "اطلاعات کاربر با موفقیت ویرایش شد");
        loadUsers();
      } catch (error: unknown) {
        console.error("Failed to edit user:", error);
        const errorMessage = getErrorMessage(error, "خطا در ویرایش کاربر");
        showToast("error", errorMessage);
      }
    },
    [
      selectedUser,
      editUser,
      editConfirmPassword,
      showToast,
      validateForm,
      loadUsers,
    ]
  );

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUser(userId);
      setShowDeleteModal(false);
      setSelectedUser(null);
      showToast("success", "کاربر با موفقیت حذف شد");
      loadUsers();
    } catch (error: unknown) {
      console.error("Failed to delete user:", error);
      const errorMessage = getErrorMessage(error, "خطا در حذف کاربر");
      showToast("error", errorMessage);
    }
  };

  const handleToggleActivity = useCallback(
    async (user: User) => {
      try {
        setUsers((prevUsers) =>
          prevUsers.map((u) =>
            u.id === user.id ? { ...u, isActive: !u.isActive } : u
          )
        );

        await updateUser(user.id, {
          firstName: user.firstName,
          lastName: user.lastName,
          phoneNumber: user.phoneNumber,
          role: user.role,
          isActive: !user.isActive,
        });

        showToast("success", "وضعیت کاربر با موفقیت تغییر کرد");
      } catch (error: unknown) {
        setUsers((prevUsers) =>
          prevUsers.map((u) =>
            u.id === user.id ? { ...u, isActive: user.isActive } : u
          )
        );

        console.error("Failed to toggle user activity:", error);
        const errorMessage = getErrorMessage(error, "خطا در تغییر وضعیت کاربر");
        showToast("error", errorMessage);
      }
    },
    [showToast]
  );

  const openEditForm = (user: User) => {
    setSelectedUser(user);
    setEditUser({
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      password: "",
      role: user.role,
      isActive: user.isActive,
    });
    setEditConfirmPassword("");
    setFormErrors({});
    setShowEditPassword(false);
    setShowEditConfirmPassword(false);
    setShowEditForm(true);
  };

  const openDeleteModal = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const openAddForm = () => {
    setNewUser({
      firstName: "",
      lastName: "",
      phoneNumber: "",
      password: "",
      role: "admin",
      isActive: true,
    });
    setConfirmPassword("");
    setFormErrors({});
    setShowPassword(false);
    setShowConfirmPassword(false);
    setShowAddForm(true);
  };

  const handlePageChange = useCallback(
    (page: number) => {
      if (page >= 1 && page <= totalPages && page !== currentPage) {
        setCurrentPage(page);
        loadUsers(page);
      }
    },
    [totalPages, currentPage, loadUsers]
  );

  const handlePreviousPage = useCallback(() => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1);
    }
  }, [currentPage, handlePageChange]);

  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1);
    }
  }, [currentPage, totalPages, handlePageChange]);

  const getPageNumbers = useCallback(() => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const startPage = Math.max(1, currentPage - 2);
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

      if (startPage > 1) {
        pages.push(1);
        if (startPage > 2) {
          pages.push("...");
        }
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pages.push("...");
        }
        pages.push(totalPages);
      }
    }

    return pages;
  }, [currentPage, totalPages]);

  if (loading) {
    return (
      <div className={styles.adminContainer}>
        <Loading
          variant="overlay"
          message="در حال بارگذاری کاربران..."
          size="large"
        />
      </div>
    );
  }

  return (
    <div className={styles.adminContainer}>
      <main className={styles.mainContent}>
        <div className={styles.adminActions}>
          <h1 className={styles.pageTitle}>مدیریت ادمین ها</h1>
          <button onClick={openAddForm} className={styles.addAdminButton}>
            <UserAddSVG />
            اضافه کردن ادمین
          </button>
        </div>

        <div className={styles.adminTable}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>نام</th>
                <th>نام خانوادگی</th>
                <th>شماره موبایل</th>
                <th>فعال / غیر فعال</th>
                <th>فعالیت ها</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.firstName}</td>
                  <td>{user.lastName}</td>
                  <td>{user.phoneNumber}</td>
                  <td>
                    <div className={styles.toggleSwitch}>
                      <input
                        type="checkbox"
                        id={`toggle-${user.id}`}
                        checked={user.isActive}
                        onChange={() => handleToggleActivity(user)}
                      />
                      <label
                        htmlFor={`toggle-${user.id}`}
                        className={styles.toggleLabel}
                      ></label>
                    </div>
                  </td>
                  <td>
                    <div className={styles.actionButtons}>
                      <button
                        onClick={() => openEditForm(user)}
                        className={styles.editButton}
                      >
                        <EditSVG />
                        ویرایش
                      </button>
                      <button
                        onClick={() => openDeleteModal(user)}
                        className={styles.deleteButton}
                      >
                        <TrashSVG />
                        حذف
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button
              className={`${styles.paginationButton} ${
                currentPage === 1 ? styles.disabled : ""
              }`}
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
            >
              <ChevronLeftSVG />
            </button>

            {getPageNumbers().map((page, index) => (
              <button
                key={index}
                className={`${styles.paginationButton} ${
                  page === currentPage ? styles.active : ""
                } ${page === "..." ? styles.ellipsis : ""}`}
                onClick={() =>
                  typeof page === "number" && handlePageChange(page)
                }
                disabled={page === "..."}
              >
                {page}
              </button>
            ))}

            <button
              className={`${styles.paginationButton} ${
                currentPage === totalPages ? styles.disabled : ""
              }`}
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
            >
              <ChevronRightSVG />
            </button>
          </div>
        )}

        {totalUsers > 0 && (
          <div className={styles.paginationInfo}>
            نمایش {(currentPage - 1) * usersPerPage + 1} تا{" "}
            {Math.min(currentPage * usersPerPage, totalUsers)} از {totalUsers}{" "}
            کاربر
          </div>
        )}
      </main>

      {showAddForm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                <UserAddSVG />
                اضافه کردن ادمین
              </h3>
              <button
                onClick={() => setShowAddForm(false)}
                className={styles.closeButton}
              >
                <CloseSVG />
              </button>
            </div>
            <form onSubmit={handleAddUser} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label htmlFor="add-name">نام</label>
                <input
                  type="text"
                  id="add-name"
                  name="firstName"
                  placeholder="نام"
                  value={newUser.firstName}
                  onChange={(e) =>
                    setNewUser({ ...newUser, firstName: e.target.value })
                  }
                  autoComplete="off"
                  required
                />
                {formErrors.firstName && (
                  <span className={styles.errorText}>
                    {formErrors.firstName}
                  </span>
                )}
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="add-family">نام خانوادگی</label>
                <input
                  type="text"
                  id="add-family"
                  name="lastName"
                  placeholder="نام خانوادگی"
                  value={newUser.lastName}
                  onChange={(e) =>
                    setNewUser({ ...newUser, lastName: e.target.value })
                  }
                  autoComplete="off"
                  required
                />
                {formErrors.lastName && (
                  <span className={styles.errorText}>
                    {formErrors.lastName}
                  </span>
                )}
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="add-mobile">شماره موبایل</label>
                <input
                  type="tel"
                  id="add-mobile"
                  name="phoneNumber"
                  placeholder="09123456789"
                  value={newUser.phoneNumber}
                  onChange={(e) =>
                    setNewUser({ ...newUser, phoneNumber: e.target.value })
                  }
                  autoComplete="off"
                  required
                />
                {formErrors.phoneNumber && (
                  <span className={styles.errorText}>
                    {formErrors.phoneNumber}
                  </span>
                )}
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="add-password">ایجاد رمز عبور</label>
                <div className={styles.passwordInput}>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="add-password"
                    name="new-password"
                    value={newUser.password}
                    onChange={(e) =>
                      setNewUser({ ...newUser, password: e.target.value })
                    }
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    className={styles.eyeButton}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeSVG /> : <EyeOffSVG />}
                  </button>
                </div>
                <small>حداقل ۸ کارکتر</small>
                {formErrors.password && (
                  <span className={styles.errorText}>
                    {formErrors.password}
                  </span>
                )}
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="add-confirm-password">تکرار رمز عبور</label>
                <div className={styles.passwordInput}>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="add-confirm-password"
                    name="confirm-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    className={styles.eyeButton}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeSVG /> : <EyeOffSVG />}
                  </button>
                </div>
                {formErrors.confirmPassword && (
                  <span className={styles.errorText}>
                    {formErrors.confirmPassword}
                  </span>
                )}
              </div>
              <div className={styles.formGroup}>
                <label className={styles.roleLabel}>سطح دسترسی</label>
                <div className={styles.roleSelection}>
                  <div className={styles.roleOption}>
                    <input
                      type="radio"
                      id="add-role-admin"
                      name="add-role"
                      value="admin"
                      checked={newUser.role === "admin"}
                      onChange={(e) =>
                        setNewUser({
                          ...newUser,
                          role: e.target.value as UserRole,
                        })
                      }
                      className={styles.roleRadio}
                    />
                    <label
                      htmlFor="add-role-admin"
                      className={styles.roleOptionLabel}
                    >
                      <span className={styles.roleText}>
                        کارشناس (دسترسی محدود برای آپلود و مشاهده پردازش ها)
                      </span>
                    </label>
                  </div>
                  <div className={styles.roleOption}>
                    <input
                      type="radio"
                      id="add-role-superadmin"
                      name="add-role"
                      value="superAdmin"
                      checked={newUser.role === "superAdmin"}
                      onChange={(e) =>
                        setNewUser({
                          ...newUser,
                          role: e.target.value as UserRole,
                        })
                      }
                      className={styles.roleRadio}
                    />
                    <label
                      htmlFor="add-role-superadmin"
                      className={styles.roleOptionLabel}
                    >
                      <span className={styles.roleText}>
                        مدیر (دسترسی کامل به مدیریت ادمین ها)
                      </span>
                    </label>
                  </div>
                </div>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="add-active">وضعیت فعال</label>
                <div className={styles.toggleSwitch}>
                  <input
                    type="checkbox"
                    id="add-active"
                    checked={newUser.isActive}
                    onChange={(e) =>
                      setNewUser({ ...newUser, isActive: e.target.checked })
                    }
                  />
                  <label
                    htmlFor="add-active"
                    className={styles.toggleLabel}
                  ></label>
                </div>
              </div>
              <button type="submit" className={styles.submitButton}>
                ثبت
              </button>
            </form>
          </div>
        </div>
      )}

      {showEditForm && selectedUser && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                <EditSVG />
                ویرایش اطلاعات ادمین
              </h3>
              <button
                onClick={() => setShowEditForm(false)}
                className={styles.closeButton}
              >
                <CloseSVG />
              </button>
            </div>
            <form onSubmit={handleEditUser} className={styles.modalForm}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="edit-name">نام</label>
                  <input
                    type="text"
                    id="edit-name"
                    name="editFirstName"
                    placeholder="پردیس"
                    value={editUser.firstName}
                    onChange={(e) =>
                      setEditUser({ ...editUser, firstName: e.target.value })
                    }
                    autoComplete="off"
                    required
                  />
                  {formErrors.firstName && (
                    <span className={styles.errorText}>
                      {formErrors.firstName}
                    </span>
                  )}
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="edit-family">نام خانوادگی</label>
                  <input
                    type="text"
                    id="edit-family"
                    name="editLastName"
                    placeholder="پیروزمند"
                    value={editUser.lastName}
                    onChange={(e) =>
                      setEditUser({ ...editUser, lastName: e.target.value })
                    }
                    autoComplete="off"
                    required
                  />
                  {formErrors.lastName && (
                    <span className={styles.errorText}>
                      {formErrors.lastName}
                    </span>
                  )}
                </div>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="edit-mobile">شماره موبایل</label>
                <input
                  type="tel"
                  id="edit-mobile"
                  name="editPhoneNumber"
                  value={editUser.phoneNumber}
                  disabled
                  autoComplete="off"
                />
                <small>شماره موبایل قابلیت ویرایش ندارد.</small>
                {formErrors.phoneNumber && (
                  <span className={styles.errorText}>
                    {formErrors.phoneNumber}
                  </span>
                )}
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="edit-password">ایجاد رمز عبور جدید</label>
                <div className={styles.passwordInput}>
                  <input
                    type={showEditPassword ? "text" : "password"}
                    id="edit-password"
                    name="editPassword"
                    value={editUser.password}
                    onChange={(e) =>
                      setEditUser({ ...editUser, password: e.target.value })
                    }
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className={styles.eyeButton}
                    onClick={() => setShowEditPassword(!showEditPassword)}
                  >
                    {showEditPassword ? <EyeSVG /> : <EyeOffSVG />}
                  </button>
                </div>
                <small>حداقل ۸ کارکتر</small>
                {formErrors.password && (
                  <span className={styles.errorText}>
                    {formErrors.password}
                  </span>
                )}
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="edit-confirm-password">
                  تایید رمز عبور جدید
                </label>
                <div className={styles.passwordInput}>
                  <input
                    type={showEditConfirmPassword ? "text" : "password"}
                    id="edit-confirm-password"
                    name="editConfirmPassword"
                    value={editConfirmPassword}
                    onChange={(e) => setEditConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className={styles.eyeButton}
                    onClick={() =>
                      setShowEditConfirmPassword(!showEditConfirmPassword)
                    }
                  >
                    {showEditConfirmPassword ? <EyeSVG /> : <EyeOffSVG />}
                  </button>
                </div>
                {formErrors.confirmPassword && (
                  <span className={styles.errorText}>
                    {formErrors.confirmPassword}
                  </span>
                )}
              </div>
              <div className={styles.formGroup}>
                <label className={styles.roleLabel}>سطح دسترسی</label>
                <div className={styles.roleSelection}>
                  <div className={styles.roleOption}>
                    <input
                      type="radio"
                      id="edit-role-admin"
                      name="edit-role"
                      value="admin"
                      checked={editUser.role === "admin"}
                      onChange={(e) =>
                        setEditUser({
                          ...editUser,
                          role: e.target.value as UserRole,
                        })
                      }
                      className={styles.roleRadio}
                    />
                    <label
                      htmlFor="edit-role-admin"
                      className={styles.roleOptionLabel}
                    >
                      <span className={styles.roleText}>
                        کارشناس (دسترسی محدود برای آپلود و مشاهده پردازش ها)
                      </span>
                    </label>
                  </div>
                  <div className={styles.roleOption}>
                    <input
                      type="radio"
                      id="edit-role-superadmin"
                      name="edit-role"
                      value="superAdmin"
                      checked={editUser.role === "superAdmin"}
                      onChange={(e) =>
                        setEditUser({
                          ...editUser,
                          role: e.target.value as UserRole,
                        })
                      }
                      className={styles.roleRadio}
                    />
                    <label
                      htmlFor="edit-role-superadmin"
                      className={styles.roleOptionLabel}
                    >
                      <span className={styles.roleText}>
                        مدیر (دسترسی کامل به مدیریت ادمین ها)
                      </span>
                    </label>
                  </div>
                </div>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="edit-active">وضعیت فعال</label>
                <div className={styles.toggleSwitch}>
                  <input
                    type="checkbox"
                    id="edit-active"
                    checked={editUser.isActive}
                    onChange={(e) =>
                      setEditUser({ ...editUser, isActive: e.target.checked })
                    }
                  />
                  <label
                    htmlFor="edit-active"
                    className={styles.toggleLabel}
                  ></label>
                </div>
              </div>
              <button type="submit" className={styles.submitButton}>
                ثبت
              </button>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && selectedUser && (
        <div className={styles.modalOverlay}>
          <div className={styles.deleteModal}>
            <div className={styles.deleteModalHeader}>
              <h3 className={styles.deleteModalTitle}>
                <TrashSVG />
                حذف ادمین
              </h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className={styles.closeButton}
              >
                <CloseSVG />
              </button>
            </div>
            <div className={styles.deleteModalContent}>
              <p>
                آیا مطمئن هستید میخواهید کاربر ({selectedUser.firstName}{" "}
                {selectedUser.lastName}) را حذف کنید؟
              </p>
              <p>پس از حذف، دسترسی این کاربر قطع خواهد شد.</p>
            </div>
            <div className={styles.deleteModalActions}>
              <button
                onClick={() => handleDeleteUser(selectedUser.id)}
                className={styles.deleteConfirmButton}
              >
                حذف
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className={styles.cancelButton}
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(AdminPage);

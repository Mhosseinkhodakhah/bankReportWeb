import { getUserById, createUser, updateUser, deleteUser } from "./userService";
import type { User } from "./types";

export {
  getUserById as getUsers,
  createUser as addUser,
  updateUser,
  deleteUser,
};

export async function toggleUserStatus(userId: string): Promise<User> {
  const user = await getUserById(userId);
  return updateUser(userId, { isActive: !user.isActive });
}

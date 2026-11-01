import prisma from "../../../config/prisma/prisma.js";
import { ApiResponse, AuthenticatedRequest } from "../../../types/common.js";

export const getUserDetails = async (
  req: AuthenticatedRequest,
  res: ApiResponse
) => {
  try {
    // Get the authenticated user's ID from the request (assumes you have a `req.user` set by the authentication middleware)
    const userId = req.user?.id;

    // Fetch the user's details from the database using Prisma
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        role: true,
        department: true,
        tenant: {
          select: {
            tenantId: true,
            companyName: true,
          },
        },
      },
    });

    if (!user) {
      console.log(`❌ User not found: ${userId}`);
      res.status(401).json({ message: "User not found" });
      return;
    }

    // Respond with the user details
    res.status(200).json(user);
  } catch (error) {
    console.error("Error during user retrieval:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateUserDetails = async (req: AuthenticatedRequest, res: ApiResponse) => {
  try {
    const userId = req.user?.id;
    const firstName = typeof req.body?.firstName === "string" ? req.body.firstName.trim() : "";
    const lastName = typeof req.body?.lastName === "string" ? req.body.lastName.trim() : "";
    const phoneNumber = typeof req.body?.phoneNumber === "string" ? req.body.phoneNumber.trim() : "";
    const department = typeof req.body?.department === "string" ? req.body.department.trim() : "";
    if (!userId || !firstName || !lastName || firstName.length > 80 || lastName.length > 80 || phoneNumber.length > 30 || department.length > 80) {
      return res.status(400).json({ message: "Enter valid first name, last name, phone, and department details." });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { firstName, lastName, phoneNumber: phoneNumber || null, department: department || null },
      select: { id: true, username: true, email: true, firstName: true, lastName: true, phoneNumber: true, role: true, department: true, tenant: { select: { tenantId: true, companyName: true } } },
    });
    return res.status(200).json(user);
  } catch (error) {
    console.error("Error updating user profile:", error);
    return res.status(500).json({ message: "Could not save profile changes." });
  }
};

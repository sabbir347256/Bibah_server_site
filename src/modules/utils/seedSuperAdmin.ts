import bcryptjs from "bcryptjs";
import { User } from "../user/user.model";
import { IsActive, Role } from "../user/user.interface";

export const seedSuperAdmin = async () => {
    try {
        const isSuperAdminExist = await User.findOne({
            email: process.env.SUPER_ADMIN_EMAIL as string,
        });

        if (isSuperAdminExist) {
            return;
        }

        const hashedPassword = await bcryptjs.hash(
            process.env.SUPER_ADMIN_PASSWORD as string,
            Number(process.env.BCRYPT_SALT_ROUND),
        );


        await User.create({
            fullName: "Super Admin",
            email: process.env.SUPER_ADMIN_EMAIL as string,
            password: hashedPassword,
            birth : "2001-01-01",
            gender : "Male",
            profession : "Admin",
            role: Role.ADMIN, 
            contactNo: "01700000000", 
            nidNo: "0000000000000",   
            isVerified: true,
            isApproved: true,
            isActive: IsActive.ACTIVE,
            auths: [] 
        });
    } catch (err) {
        console.log(err);
    }
};

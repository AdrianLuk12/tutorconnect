import React, { useEffect, useState, Suspense } from "react";
import { useForm } from "react-hook-form";
import { AuthActions } from "@/app/auth/utils";
import { useSearchParams, useRouter } from "next/navigation";
type FormData = {
    password: string;
    confirm_password: string;
};

// Create a separate component for the form
const ResetPasswordForm = () => {
    const {
        register,
        handleSubmit,
        setError,
        formState: { errors },
    } = useForm<FormData>();
    const router = useRouter();
    const { resetPasswordConfirm } = AuthActions();

    const searchParams = useSearchParams();

    // State for UID and Token
    const [uid, setUid] = useState("");
    const [token, setToken] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Extract UID and Token from URL
    useEffect(() => {
        if (searchParams.get("uid") && searchParams.get("token")) {
            setUid(searchParams.get("uid") as string);
            setToken(searchParams.get("token") as string);
        }
    }, [searchParams]);

    const onSubmit = async (data: FormData) => {

        if (data.password !== data.confirm_password) {
            setError("confirm_password", {
                type: "manual",
                message: "Passwords do not match",
            });
            return;
        }

        try {
            await resetPasswordConfirm(
                data.password,
                data.password,
                token,
                uid,
            ).res();
            alert("Password has been reset successfully.");
            router.push("/");
        } catch (err: any) {
            // alert("Failed to reset password. Please try again.");
            if (err.json.new_password) {
                setError("password", {
                    type: "manual",
                    message: err.json.new_password[0],
                });
            }
            // console.log(err.json)
            // console.log(err.json.password)
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="px-8 py-6 mt-4 text-left bg-white shadow-lg w-1/3">
                <h3 className="text-2xl font-semibold">Set New Password</h3>
                <form onSubmit={handleSubmit(onSubmit)} className="mt-4">
                    <label className="block" htmlFor="password">
                        New Password
                    </label>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your new password"
                            {...register("password", { required: true })}
                            className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
                        />
                        <button
                            type="button"
                            className="absolute right-3 top-1/2 transform -translate-y-1/2"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? "👁️" : "👁️‍🗨️"}
                        </button>
                    </div>
                    {/* {errors.password && (
                        <span className="text-xs text-red-600">Password is required</span>
                    )} */}
                    {errors.password && (
                        <span className="text-xs text-red-600">
                            {errors.password.message}
                        </span>
                    )}
                    <label className="block mt-2" htmlFor="confirm_password">
                        Confirm Password
                    </label>
                    <div className="relative">
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm your new password"
                            {...register("confirm_password", { required: true })}
                            className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
                        />
                        <button
                            type="button"
                            className="absolute right-3 top-1/2 transform -translate-y-1/2"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                            {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                        </button>
                    </div>
                    {/* {errors.password && (
                        <span className="text-xs text-red-600">Confirm Password is required</span>
                    )} */}
                    {errors.confirm_password && (
                        <span className="text-xs text-red-600">
                            {errors.confirm_password.message}
                        </span>
                    )}
                    <div className="flex items-center justify-between mt-4">
                        <button className="px-12 py-2 leading-5 text-white transition-colors duration-200 transform bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:bg-blue-700">
                            Reset Password
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Main component with Suspense
const ResetPasswordConfirmation = () => {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ResetPasswordForm />
        </Suspense>
    );
};

export default ResetPasswordConfirmation;


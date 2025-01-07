import React from "react";
import { useForm } from "react-hook-form";
import { AuthActions } from "@/app/auth/utils";
import { useRouter } from "next/navigation";
import Link from "next/link";

type FormData = {
    email: string;
    username: string;
    password: string;
    re_password: string;
};

const Register = () => {
    const {
        register,
        handleSubmit,
        formState: { errors },
        setError,
    } = useForm<FormData>();

    const router = useRouter();

    const { register: registerUser } = AuthActions(); // Note: Renamed to avoid naming conflict with useForm's register

    const onSubmit = (data: FormData) => {
        registerUser(data.email, data.username, data.password, data.re_password)
            .json(() => {
                router.push("/");
            })
            .catch((err) => {
                if (err.json.detail) {
                    setError("root", {
                        type: "manual",
                        message: err.json.detail[0],
                    });
                }
                // setError("root", {
                //     type: "manual",
                //     message: err.json.detail,
                // });
                if (err.json.email) {
                    setError("email", {
                        type: "manual",
                        message: err.json.email[0],
                    });
                }
                if (err.json.password) {
                    setError("password", {
                        type: "manual",
                        message: err.json.password[0],
                    });
                }
                if (err.json.non_field_errors) {
                    setError("re_password", {
                        type: "manual",
                        message: err.json.non_field_errors[0],
                    });
                }
                
            });
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="px-8 py-6 mt-4 text-left bg-white shadow-lg w-1/3">
                <h3 className="text-2xl font-semibold">Register your account</h3>
                <form onSubmit={handleSubmit(onSubmit)} className="mt-4">
                    <div>
                        <label className="block" htmlFor="email">
                            Email
                        </label>
                        <input
                            type="text"
                            placeholder="Email"
                            {...register("email", { required: "Email is required" })}
                            className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
                        />
                        {errors.email && (
                            <span className="text-xs text-red-600">
                                {errors.email.message}
                            </span>
                        )}
                    </div>
                    <div className="mt-4">
                        <label className="block" htmlFor="username">
                            Username
                        </label>
                        <input
                            type="text"
                            placeholder="Username"
                            {...register("username", { required: "Username is required" })}
                            className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
                        />
                        {errors.username && (
                            <span className="text-xs text-red-600">
                                {errors.username.message}
                            </span>
                        )}
                    </div>
                    <div className="mt-4">
                        <label className="block" htmlFor="password">
                            Password
                        </label>
                        <input
                            type="password"
                            placeholder="Password"
                            {...register("password", { required: "Password is required" })}
                            className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
                        />
                        {errors.password && (
                            <span className="text-xs text-red-600">
                                {errors.password.message}
                            </span>
                        )}
                    </div>
                    <div className="mt-4">
                        <label className="block" htmlFor="re_password">
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            placeholder="Confirm Password"
                            {...register("re_password", { required: "Confirm Password is required" })}
                            className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
                        />
                        {errors.re_password && (
                            <span className="text-xs text-red-600">
                                {errors.re_password.message}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center justify-between mt-4">
                        <button className="px-12 py-2 leading-5 text-white transition-colors duration-200 transform bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:bg-blue-700">
                            Register
                        </button>
                    </div>
                    {errors.root && (
                        <span className="text-xs text-red-600">{errors.root.message}</span>
                    )}
                </form>

                <div className="mt-6 text-center">
                    <Link
                        href="/"
                        className="text-sm text-blue-600 hover:underline"
                    >
                        Login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Register;

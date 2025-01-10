import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { AuthActions } from "@/app/auth/utils";
import { useRouter } from "next/navigation";
import Link from "next/link";

type FormData = {
    email: string;
    username: string;
    password: string;
    re_password: string;
    // first_name: string;
    // last_name: string;
    terms: boolean;
};

const Register = () => {
    const {
        register,
        handleSubmit,
        formState: { errors },
        setError,
    } = useForm<FormData>();

    const router = useRouter();

    const { register: registerUser, isAuthenticated, autoLoginAfterRegister } = AuthActions();

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        if (isAuthenticated()) {
            router.push('/dashboard');
        }
    }, [router]);

    const onSubmit = async (data: FormData) => {
        try {
            await registerUser(
                data.email.toLowerCase(), 
                data.username, 
                data.password, 
                data.re_password,
                // data.first_name,
                // data.last_name
            ).json();
            
            // Auto login after successful registration
            const loginSuccess = await autoLoginAfterRegister(data.email.toLowerCase(), data.password);
            
            if (loginSuccess) {
                router.push("/onboarding");
            } else {
                router.push("/auth/login");
                alert("Account created successfully. Please login.");
            }
        } catch (err: any) {
            if (err.json.detail) {
                setError("root", {
                    type: "manual",
                    message: err.json.detail[0],
                });
            }
            if (err.json.email) {
                setError("email", {
                    type: "manual",
                    message: err.json.email[0],
                });
            }
            if (err.json.username) {
                setError("username", {
                    type: "manual",
                    message: err.json.username[0],
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
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="px-8 py-6 mt-4 text-left bg-white shadow-lg w-1/3">
                <h3 className="text-2xl font-semibold">Register</h3>
                <form onSubmit={handleSubmit(onSubmit)} className="mt-4">
                    <div>
                        <label className="block" htmlFor="email">
                            Email
                        </label>
                        <input
                            type="text"
                            placeholder="john.doe@example.com"
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
                            Username (No Spaces)
                        </label>
                        <input
                            type="text"
                            placeholder="JohnDoe"
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
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                {...register("password", { required: "Password is required" })}
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
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                {...register("re_password", { required: "Confirm Password is required" })}
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
                        {errors.re_password && (
                            <span className="text-xs text-red-600">
                                {errors.re_password.message}
                            </span>
                        )}
                    </div>
                    {/* <div className="mt-4">
                        <label className="block" htmlFor="first_name">
                            First Name
                        </label>
                        <input
                            type="text"
                            placeholder="John"
                            {...register("first_name")}
                            className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
                        />
                    </div>
                    <div className="mt-4">
                        <label className="block" htmlFor="last_name">
                            Last Name
                        </label>
                        <input
                            type="text"
                            placeholder="Doe"
                            {...register("last_name")}
                            className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
                        />
                    </div> */}
                    <div className="mt-4">
                        <label className="flex items-center text-sm">
                            <input
                                type="checkbox"
                                {...register("terms", { required: "You must accept the Terms and Privacy Policy" })}
                                className="mr-2"
                            />
                            <span>I accept the <Link href="/terms" className="text-blue-600 hover:underline">Terms of Use</Link> & <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link></span>
                        </label>
                        {errors.terms && (
                            <span className="text-xs text-red-600">
                                {errors.terms.message}
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

                {/* <div className="mt-6 text-center">
                    <Link
                        href="/auth/login"
                        className="text-sm text-blue-600 hover:underline"
                    >
                        Already have an account? Sign in
                    </Link>
                </div> */}
                <div className="mt-4 text-sm text-center">Already have an account? <a href="/auth/login" className="text-sm text-blue-600 hover:underline">Sign in</a></div>
            </div>
        </div>
    );
};

export default Register;

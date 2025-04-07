import React, { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { Button, Input, RTE, Select } from "..";
import appwriteService from "../../appwrite/config";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

export default function PostForm({ post }) {
    const [error, setError] = useState("");
    const { register, handleSubmit, watch, setValue, control, getValues } = useForm({
        defaultValues: {
            title: post?.title || "",
            slug: post?.$id || "",
            content: post?.content || "",
            status: post?.status || "active",
        },
    });

    const navigate = useNavigate();
    const userData = useSelector((state) => state.auth.userData);
    
    // Add console logging for debugging
    console.log("PostForm userData:", userData);

    const submit = async (data) => {
        setError("");
        console.log("Form data:", data);
        
        try {
            if (post) {
                const file = data.image[0] ? await appwriteService.uploadFile(data.image[0]) : null;

                if (file) {
                    appwriteService.deleteFile(post.featuredImage);
                }

                const dbPost = await appwriteService.updatePost(post.$id, {
                    ...data,
                    featuredImage: file ? file.$id : undefined,
                });

                if (dbPost) {
                    navigate(`/post/${dbPost.$id}`);
                }
            } else {
                console.log("Creating new post with data:", data);
                
                if (data.image && data.image[0]) {
                    console.log("Uploading image:", data.image[0]);
                    
                    try {
                        const file = await appwriteService.uploadFile(data.image[0]);
                        console.log("File upload response:", file);
                        
                        if (file) {
                            const fileId = file.$id;
                            data.featuredImage = fileId;
                            
                            if (!userData) {
                                setError("User data not available. Please log in again.");
                                console.error("User data not available. Please log in again.");
                                return;
                            }
                            
                            console.log("Creating post with user ID:", userData.$id);
                            const dbPost = await appwriteService.createPost({ ...data, userId: userData.$id });
                            console.log("Post creation response:", dbPost);
                            
                            if (dbPost) {
                                navigate(`/post/${dbPost.$id}`);
                            } else {
                                setError("Failed to create post after file upload");
                            }
                        }
                    } catch (uploadError) {
                        console.error("File upload error:", uploadError);
                        setError(`File upload failed: ${uploadError.message}`);
                    }
                } else {
                    setError("Please select an image file");
                    console.error("Please select an image file");
                }
            }
        } catch (error) {
            setError(error.message || "Error creating post");
            console.error("Error submitting post:", error);
        }
    };

    const slugTransform = useCallback((value) => {
        if (value && typeof value === "string") {
            return value
                .trim()
                .toLowerCase()
                .replace(/[^a-zA-Z\d\s]+/g, "-")
                .replace(/\s/g, "-");
        }
        return "";
    }, []);

    React.useEffect(() => {
        const subscription = watch((value, { name }) => {
            if (name === "title") {
                setValue("slug", slugTransform(value.title), { shouldValidate: true });
            }
        });

        return () => subscription.unsubscribe();
    }, [watch, slugTransform, setValue]);

    return (
        <form onSubmit={handleSubmit(submit)} className="flex flex-wrap">
            {error && <div className="w-full mb-4 text-center text-red-500">{error}</div>}
            <div className="w-2/3 px-2">
                <Input
                    label="Title :"
                    placeholder="Title"
                    className="mb-4"
                    {...register("title", { required: true })}
                />
                <Input
                    label="Slug :"
                    placeholder="Slug"
                    className="mb-4"
                    {...register("slug", { required: true })}
                    onInput={(e) => {
                        setValue("slug", slugTransform(e.currentTarget.value), { shouldValidate: true });
                    }}
                />
                <RTE label="Content :" name="content" control={control} defaultValue={getValues("content")} />
            </div>
            <div className="w-1/3 px-2">
                <Input
                    label="Featured Image :"
                    type="file"
                    className="mb-4"
                    accept="image/png, image/jpg, image/jpeg, image/gif"
                    {...register("image", { required: !post })}
                />
                {post && (
                    <div className="w-full mb-4">
                        <img
                            src={appwriteService.getFilePreview(post.featuredImage)}
                            alt={post.title}
                            className="rounded-lg"
                        />
                    </div>
                )}
                <Select
                    options={["active", "inactive"]}
                    label="Status"
                    className="mb-4"
                    {...register("status", { required: true })}
                />
                <Button type="submit" bgColor={post ? "bg-green-500" : undefined} className="w-full">
                    {post ? "Update" : "Submit"}
                </Button>
            </div>
        </form>
    );
}

import { useEffect, useId, useRef, useState } from "react";

import { useNavigate, useLocation } from "react-router-dom";

import { FiUpload } from "react-icons/fi";

import Navbar from "../components/Navbar";

import SortableImagePreviewGrid from "../components/SortableImagePreviewGrid";

import { useToast } from "../context/ToastContext";

import {

    createGroupBlurHandler,

    getFieldClass,

    getFormGroupClass,

    shouldShowFieldError,

    touchAllFields,

} from "../utils/formValidation";



const API_ORIGIN = "http://localhost:5000";

const MAX_IMAGES = 10;
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;



function createFileItem(file, index) {

    return {

        id: `file-${Date.now()}-${index}-${file.name}`,

        kind: "file",

        file,

        preview: URL.createObjectURL(file),

    };

}



function createExistingItem(path, index) {

    return {

        id: `existing-${index}-${path}`,

        kind: "existing",

        path,

        preview: `${API_ORIGIN}${path}`,

    };

}



function CreatePost() {

    const navigate = useNavigate();

    const routerLocation = useLocation();

    const editingPost = routerLocation.state?.post;

    const { showToast } = useToast();

    const fileInputId = useId();

    const fileItemsRef = useRef([]);

    const fileInputRef = useRef(null);

    const appendImagesRef = useRef(false);



    const [productName, setProductName] = useState("");

    const [price, setPrice] = useState("");

    const [location, setLocation] = useState("");

    const [description, setDescription] = useState("");

    const [imageItems, setImageItems] = useState([]);

    const [errors, setErrors] = useState({});

    const [touched, setTouched] = useState({

        productName: false,

        price: false,

        location: false,

        description: false,

        image: false,

    });

    const [submitted, setSubmitted] = useState(false);

    const [loading, setLoading] = useState(false);



    const formFields = [

        "productName",

        "price",

        "location",

        "description",

        "image",

    ];



    useEffect(() => {

        fileItemsRef.current = imageItems;

    }, [imageItems]);



    useEffect(() => {

        if (!editingPost) return;



        setProductName(editingPost.productName);

        setPrice(editingPost.price);

        setLocation(editingPost.location);

        setDescription(editingPost.description);



        const savedImages =

            Array.isArray(editingPost.images) && editingPost.images.length

                ? editingPost.images

                : editingPost.image

                  ? [editingPost.image]

                  : [];



        setImageItems(

            savedImages.map((path, index) => createExistingItem(path, index))

        );

    }, [editingPost]);



    useEffect(() => {

        return () => {

            fileItemsRef.current.forEach((item) => {

                if (item.kind === "file" && item.preview.startsWith("blob:")) {

                    URL.revokeObjectURL(item.preview);

                }

            });

        };

    }, []);



    const revokeFilePreviews = (items) => {

        items.forEach((item) => {

            if (item.kind === "file" && item.preview.startsWith("blob:")) {

                URL.revokeObjectURL(item.preview);

            }

        });

    };



    const validateProductName = (value) => {

        if (!value.trim()) return "Product name is required";

        return "";

    };



    const validatePrice = (value) => {

        if (!value) return "Price is required";

        if (Number(value) <= 0) return "Please enter a valid price";

        return "";

    };



    const validateLocation = (value) => {

        if (!value.trim()) return "Location is required";

        return "";

    };



    const validateDescription = (value) => {

        if (!value.trim()) return "Description is required";

        return "";

    };



    const validateImage = (items, isEditing = Boolean(editingPost)) => {

        if (!isEditing && (!items || !items.length)) {

            return "Please select at least one image";

        }



        if (isEditing && (!items || !items.length)) {

            return "Please keep at least one image";

        }



        const oversized = (items || []).find(

            (item) =>

                item?.kind === "file" &&

                item.file &&

                item.file.size > MAX_IMAGE_SIZE_BYTES

        );



        if (oversized) {

            return "Each image must be 5 MB or smaller";

        }



        return "";

    };



    const validateField = (

        field,

        fieldValues = {

            productName,

            price,

            location,

            description,

            image: imageItems,

        }

    ) => {

        if (field === "productName") {

            return validateProductName(fieldValues.productName);

        }

        if (field === "price") return validatePrice(fieldValues.price);

        if (field === "location") return validateLocation(fieldValues.location);

        if (field === "description") {

            return validateDescription(fieldValues.description);

        }

        if (field === "image") return validateImage(fieldValues.image);

        return "";

    };



    const handleBlur = (field) => {

        setTouched((prev) => ({ ...prev, [field]: true }));

        setErrors((prev) => ({

            ...prev,

            [field]: validateField(field),

            api: "",

        }));

    };



    const updateField = (field, value) => {

        if (field === "productName") setProductName(value);

        if (field === "price") setPrice(value);

        if (field === "location") setLocation(value);

        if (field === "description") setDescription(value);



        const nextValues = {

            productName,

            price,

            location,

            description,

            image: imageItems,

            [field]: value,

        };



        if (touched[field] || submitted) {

            setErrors((prev) => ({

                ...prev,

                [field]: validateField(field, nextValues),

                api: "",

            }));

        } else {

            setErrors((prev) => ({ ...prev, api: "" }));

        }

    };



    const handleImageFiles = (fileList, { append = false } = {}) => {

        const selectedFiles = Array.from(fileList || []);

        if (!selectedFiles.length) return;



        const imageFiles = selectedFiles.filter((file) =>

            file.type.startsWith("image/")

        );

        const oversizedFiles = imageFiles.filter(

            (file) => file.size > MAX_IMAGE_SIZE_BYTES

        );

        const validFiles = imageFiles.filter(

            (file) => file.size <= MAX_IMAGE_SIZE_BYTES

        );



        if (!imageFiles.length) {

            showToast("Only image files are allowed", "error");

            return;

        }



        if (oversizedFiles.length) {

            showToast("Each image must be 5 MB or smaller", "error");

        }



        if (!validFiles.length) return;



        if (append) {

            setImageItems((prev) => {

                const remaining = MAX_IMAGES - prev.length;

                if (remaining <= 0) {

                    showToast("Maximum 10 images allowed", "error");

                    return prev;

                }



                const filesToAdd = validFiles.slice(0, remaining);

                if (validFiles.length > remaining) {

                    showToast(

                        `Only ${remaining} more image(s) added (10 max)`,

                        "error"

                    );

                }



                const nextItems = [

                    ...prev,

                    ...filesToAdd.map((file, index) =>

                        createFileItem(file, Date.now() + index)

                    ),

                ];



                setErrors((current) => ({

                    ...current,

                    image: validateImage(nextItems),

                    api: "",

                }));



                return nextItems;

            });

        } else {

            setImageItems((prev) => {

                revokeFilePreviews(prev.filter((item) => item.kind === "file"));

                return validFiles.map((file, index) =>

                    createFileItem(file, index)

                );

            });



            setErrors((prev) => ({

                ...prev,

                image: validateImage(

                    validFiles.map((file) => ({ kind: "file", file }))

                ),

                api: "",

            }));

        }



        setTouched((prev) => ({ ...prev, image: true }));

    };



    const handleAddMoreImages = () => {

        appendImagesRef.current = true;

        fileInputRef.current?.click();

    };



    const handleImageReorder = (nextItems) => {

        setImageItems(nextItems);

    };



    const handleImageRemove = (itemId) => {

        if (imageItems.length <= 1) {

            showToast("Keep at least one product image", "error");

            return;

        }



        setImageItems((prev) => {

            const removed = prev.find((item) => item.id === itemId);

            if (removed?.kind === "file" && removed.preview.startsWith("blob:")) {

                URL.revokeObjectURL(removed.preview);

            }



            const nextItems = prev.filter((item) => item.id !== itemId);

            setErrors((current) => ({

                ...current,

                image: validateImage(nextItems),

                api: "",

            }));



            return nextItems;

        });

    };



    const handleSubmit = async (e) => {

        e.preventDefault();



        setSubmitted(true);

        touchAllFields(setTouched, formFields);



        const newErrors = {

            productName: validateProductName(productName),

            price: validatePrice(price),

            location: validateLocation(location),

            description: validateDescription(description),

            image: validateImage(imageItems),

        };



        setErrors((prev) => ({ ...prev, ...newErrors }));



        if (Object.values(newErrors).some(Boolean)) return;



        const formData = new FormData();



        formData.append("productName", productName);

        formData.append("price", price);

        formData.append("location", location);

        formData.append("description", description);



        const hasExisting = imageItems.some((item) => item.kind === "existing");

        const hasFiles = imageItems.some((item) => item.kind === "file");



        if (hasExisting && hasFiles) {

            formData.append(

                "imageSequence",

                JSON.stringify(

                    imageItems.map((item) =>

                        item.kind === "existing"

                            ? { type: "existing", path: item.path }

                            : { type: "new" }

                    )

                )

            );



            imageItems.forEach((item) => {

                if (item.kind === "file") {

                    formData.append("images", item.file);

                }

            });

        } else if (hasFiles) {

            imageItems.forEach((item) => {

                if (item.kind === "file") {

                    formData.append("images", item.file);

                }

            });

        }

        setLoading(true);

        try {
            const token = localStorage.getItem("accessToken");

            const url = editingPost
                ? `http://localhost:5000/api/posts/${editingPost._id}`
                : "http://localhost:5000/api/posts";

            const method = editingPost ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            let data = {};

            try {
                data = await response.json();
            } catch {
                data = {
                    message: `Server error (${response.status}). Restart the backend and try again.`,
                };
            }

            if (!response.ok) {
                setErrors({
                    api: data.message,
                });
                return;
            }

            if (editingPost && !hasFiles) {
                const orderedPaths = imageItems
                    .filter((item) => item.kind === "existing")
                    .map((item) => item.path);

                if (orderedPaths.length) {
                    const reorderResponse = await fetch(
                        `http://localhost:5000/api/posts/${editingPost._id}/image-order`,
                        {
                            method: "PATCH",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${token}`,
                            },
                            body: JSON.stringify({ imageOrder: orderedPaths }),
                        }
                    );

                    let reorderData = {};

                    try {
                        reorderData = await reorderResponse.json();
                    } catch {
                        reorderData = {
                            message:
                                "Could not update image order. Restart the backend and try again.",
                        };
                    }

                    if (!reorderResponse.ok) {
                        setErrors({
                            api:
                                reorderData.message ||
                                "Could not update image order",
                        });
                        return;
                    }

                    data = reorderData;
                }
            }

            if (response.ok) {

                showToast(

                    editingPost

                        ? "Post updated successfully"

                        : "Post created successfully"

                );

                navigate(editingPost ? "/my-listings" : "/marketplace");

            } else {

                setErrors({

                    api: data.message,

                });

            }

        } catch (error) {

            setErrors({

                api:

                    error.message ||

                    "Could not reach the server. Make sure the backend is running.",

            });

        } finally {

            setLoading(false);

        }

    };



    const showImageError = shouldShowFieldError(

        errors,

        touched,

        submitted,

        "image"

    );



    return (

        <>

            <Navbar />



            <div className="form-page">

                <div className="form-card">

                    <div className="form-card-header">

                        <h1 className="form-card-title">

                            {editingPost ? "Edit Post" : "Create Post"}

                        </h1>

                        <p className="form-card-subtitle">

                            {editingPost

                                ? "Update your listing details below"

                                : "Fill in the details to list your product"}

                        </p>

                    </div>



                    <form onSubmit={handleSubmit} noValidate>

                        <div

                            className={getFormGroupClass(

                                errors,

                                touched,

                                submitted,

                                "productName"

                            )}

                            onBlur={createGroupBlurHandler(

                                "productName",

                                handleBlur

                            )}

                        >

                            <input

                                type="text"

                                className={getFieldClass(

                                    errors,

                                    touched,

                                    submitted,

                                    "productName"

                                )}

                                placeholder=" "

                                value={productName}

                                disabled={loading}

                                aria-invalid={shouldShowFieldError(

                                    errors,

                                    touched,

                                    submitted,

                                    "productName"

                                )}

                                onBlur={() => handleBlur("productName")}

                                onChange={(e) =>

                                    updateField("productName", e.target.value)

                                }

                            />

                            <label>

                                Product Name <span className="required">*</span>

                            </label>

                            <p className="error">

                                {shouldShowFieldError(

                                    errors,

                                    touched,

                                    submitted,

                                    "productName"

                                )

                                    ? errors.productName

                                    : ""}

                            </p>

                        </div>



                        <div className="form-row">

                            <div

                                className={getFormGroupClass(

                                    errors,

                                    touched,

                                    submitted,

                                    "price"

                                )}

                                onBlur={createGroupBlurHandler("price", handleBlur)}

                            >

                                <input

                                    type="number"

                                    className={getFieldClass(

                                        errors,

                                        touched,

                                        submitted,

                                        "price"

                                    )}

                                    placeholder=" "

                                    value={price}

                                    disabled={loading}

                                    aria-invalid={shouldShowFieldError(

                                        errors,

                                        touched,

                                        submitted,

                                        "price"

                                    )}

                                    onBlur={() => handleBlur("price")}

                                    onChange={(e) =>

                                        updateField("price", e.target.value)

                                    }

                                />

                                <label>

                                    Price <span className="required">*</span>

                                </label>

                                <p className="error">

                                    {shouldShowFieldError(

                                        errors,

                                        touched,

                                        submitted,

                                        "price"

                                    )

                                        ? errors.price

                                        : ""}

                                </p>

                            </div>



                            <div

                                className={getFormGroupClass(

                                    errors,

                                    touched,

                                    submitted,

                                    "location"

                                )}

                                onBlur={createGroupBlurHandler(

                                    "location",

                                    handleBlur

                                )}

                            >

                                <input

                                    type="text"

                                    className={getFieldClass(

                                        errors,

                                        touched,

                                        submitted,

                                        "location"

                                    )}

                                    placeholder=" "

                                    value={location}

                                    disabled={loading}

                                    aria-invalid={shouldShowFieldError(

                                        errors,

                                        touched,

                                        submitted,

                                        "location"

                                    )}

                                    onBlur={() => handleBlur("location")}

                                    onChange={(e) =>

                                        updateField("location", e.target.value)

                                    }

                                />

                                <label>

                                    Location <span className="required">*</span>

                                </label>

                                <p className="error">

                                    {shouldShowFieldError(

                                        errors,

                                        touched,

                                        submitted,

                                        "location"

                                    )

                                        ? errors.location

                                        : ""}

                                </p>

                            </div>

                        </div>



                        <div

                            className={getFormGroupClass(

                                errors,

                                touched,

                                submitted,

                                "description"

                            )}

                            onBlur={createGroupBlurHandler(

                                "description",

                                handleBlur

                            )}

                        >

                            <textarea

                                className={getFieldClass(

                                    errors,

                                    touched,

                                    submitted,

                                    "description"

                                )}

                                rows="4"

                                placeholder=" "

                                value={description}

                                disabled={loading}

                                aria-invalid={shouldShowFieldError(

                                    errors,

                                    touched,

                                    submitted,

                                    "description"

                                )}

                                onBlur={() => handleBlur("description")}

                                onChange={(e) =>

                                    updateField("description", e.target.value)

                                }

                            />

                            <label>

                                Description <span className="required">*</span>

                            </label>

                            <p className="error">

                                {shouldShowFieldError(

                                    errors,

                                    touched,

                                    submitted,

                                    "description"

                                )

                                    ? errors.description

                                    : ""}

                            </p>

                        </div>



                        <div

                            className={`image-upload${

                                showImageError ? " has-error" : ""

                            }`}

                            onBlur={createGroupBlurHandler("image", handleBlur)}

                        >

                            <label

                                className="image-upload-label"

                                htmlFor={fileInputId}

                            >

                                Product Images <span className="required">*</span>

                            </label>



                            <input

                                id={fileInputId}

                                ref={fileInputRef}

                                className="image-upload-input"

                                type="file"

                                accept="image/*"

                                multiple

                                disabled={loading}

                                onChange={(e) => {

                                    handleImageFiles(e.target.files, {

                                        append: appendImagesRef.current,

                                    });

                                    appendImagesRef.current = false;

                                    e.target.value = "";

                                }}

                            />



                            <div

                                className={`image-dropzone${

                                    showImageError ? " has-error" : ""

                                }`}

                            >

                                {imageItems.length ? (

                                    <>

                                        <SortableImagePreviewGrid

                                            items={imageItems}

                                            onReorder={handleImageReorder}

                                            onRemove={handleImageRemove}

                                            onAddMore={handleAddMoreImages}

                                            maxItems={MAX_IMAGES}

                                            disabled={loading}

                                        />

                                        <p className="image-preview-sort-hint">

                                            Drag to reorder, The first image is

                                            the listing thumbnail.

                                        </p>

                                    </>

                                ) : (

                                    <label

                                        htmlFor={fileInputId}

                                        className="image-dropzone-empty"

                                    >

                                        <FiUpload />

                                        <p>Click to upload product images</p>

                                        <span>

                                            PNG, JPG up to 5 MB each. You can

                                            select multiple images.

                                        </span>

                                    </label>

                                )}

                            </div>



                            <p className="error">

                                {showImageError ? errors.image : ""}

                            </p>

                        </div>



                        <button

                            type="submit"

                            className="form-submit-btn"

                            disabled={loading}

                        >

                            {loading

                                ? editingPost

                                    ? "Updating..."

                                    : "Creating..."

                                : editingPost

                                  ? "Update Post"

                                  : "Create Post"}

                        </button>



                        {errors.api && (

                            <p className="api-error">{errors.api}</p>

                        )}

                    </form>

                </div>

            </div>

        </>

    );

}



export default CreatePost;



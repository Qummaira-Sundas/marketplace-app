export function shouldShowFieldError(errors, touched, submitted, field) {
    return Boolean(errors[field] && (touched[field] || submitted));
}

export function getFormGroupClass(errors, touched, submitted, field) {
    return `form-group${
        shouldShowFieldError(errors, touched, submitted, field)
            ? " has-error"
            : ""
    }`;
}

export function getFieldClass(errors, touched, submitted, field) {
    return shouldShowFieldError(errors, touched, submitted, field)
        ? "field-invalid"
        : "";
}

export function touchAllFields(setTouched, fields) {
    setTouched(
        fields.reduce(
            (acc, field) => ({
                ...acc,
                [field]: true,
            }),
            {}
        )
    );
}

export function createGroupBlurHandler(field, handleBlur) {
    return (event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
            handleBlur(field);
        }
    };
}

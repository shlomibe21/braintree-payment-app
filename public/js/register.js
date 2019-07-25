'use strict';

$('.register-form').submit(event => {
    event.preventDefault();
    // Fetch all the the data from the form
    let fields = $(".register-form").serializeArray();

    // Build an object with all the form's fields
    let formData = {};    
    jQuery.each(fields, function (i, field) {
        formData[field.name] = field.value;
    });  
    $.ajax({
        url: "/api/users/",
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(formData),
        success: function (data) {
            alert("Registration was successful!");
            // Upon success go to login page
            window.location.href = "/login.html";
        },
        error: function (error) {
            const message = 'Error ' + error.responseJSON.location + ': ' + error.responseJSON.message;
            console.log('error', error);
            $('.js-error-message').html(message);
        },
    });
});

function handleRegistration() {
    inputFocus();
    inputBlur();
}

$(handleRegistration);
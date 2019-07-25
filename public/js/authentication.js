'use strict';

let localAuthToken = localStorage.getItem('token');

// Check if user is authenticated and display related account information
if (localAuthToken) {
    // User is authenticated display related account info
    $('.top-nav').append(displayLoggedInInfo());
}
else {
    // User is not authenticated display related account info
    $('.top-nav').append(displayLoggedOutInfo());
}

// Display related information in case that user is authenticated
function displayLoggedInInfo() {
    return `
        <a href="/subscriptions-page.html" class="top-nav-link">Projects</a>
		<a href="/" class="logout-link top-nav-link">Logout</a>
	`
}

// Display related information in case that user is not authenticated
function displayLoggedOutInfo() {
    return `
    <a href="/login.html" class="login-link top-nav-link">Login</a>
	`
}

$('.login-form').submit(event => {
    event.preventDefault();
    // Fetch all the the data from the form
    let fields = $("form").serializeArray();
    
    // Build an object with all the form's fields
    let formData = {};
    jQuery.each(fields, function (i, field) {
        formData[field.name] = field.value;
    });
    
    $.ajax({
        url: "/api/auth/login",
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(formData),
        success: function (jwt) {
            // Store authToken on client side
            localStorage.setItem('token', jwt.authToken);
            // Upon success go to subscriptions form
            window.location.href = "subscriptions-page.html";
        },
        error: function (error) {
            console.log('error', error);
            const message = 'Incorrect username or password. Please fix and try again.';
            $('.js-error-message').html(message);
        },
    });
});

// logut a user
function logoutClicked() {
    $('.top-nav').on('click', '.logout-link', event => {
        event.preventDefault();
        // Clear the token
        localStorage.setItem('token', '');
        // Move to index.html
        window.location.href = "/";
    });
}

function inputFocus() {
    $('.login-form, .register-form').on('focus', 'input', event => {
        $(event.currentTarget).attr('placeholder','');
        let label = $(event.currentTarget).closest('div').find('label');
        label.css("visibility", "visible");
    });
}

function inputBlur() {
    $('.login-form, .register-form').on('blur', 'input', event => {
        let label = $(event.currentTarget).closest('div').find('label');
        let labelText = label.text();
        let input = $(event.currentTarget).closest('div').find('input');
        let inputText = input.val();
        if(inputText === '') {
            $(event.currentTarget).attr('placeholder', labelText);
            //label.fadeOut();
            label.css("visibility", "hidden");
        }
    });
}

function handleAuthentication() {
    logoutClicked();
    inputFocus();
    inputBlur();
}

$(handleAuthentication);
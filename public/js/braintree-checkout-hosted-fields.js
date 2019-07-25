'use strict';

let existingPaymentMethodsCount = 0;
// Indicates if user has the existingPaymentMethodsView open or not
let existingPaymentMethodsView = false;
let existingNonce = null;
let postUrl = "/checkout/newWithCustomerId";
let subscriptionType;
let subscriptionPrice;

// If user is not authenticated go to login page
if (!localAuthToken) {
    window.location.href = "/login.html";
}

function displayPaymentForm() {
    let getUrl = "/checkout/newWithCustomerId";
    //let udbId = document.getElementById('udbId').value;
    //let postData = {"udbId": udbId};
    let clientToken;
    let element;
    let extraFieldsClass = $('.extra-field');
    let inUrl = window.location;

    let userInfo = getDemoUserInfo();
    console.log(userInfo.firstName);
    console.log(userInfo.customerId);

    let udbId = ''; //userInfo.customerId;
    let postData = {
        "udbId": udbId
    };

    subscriptionType = getQueryVariable(inUrl, 'subType');
    if (subscriptionType === 'OncaBasic') {
        subscriptionPrice = getSubscriptionPrice(subscriptionType);
    } else if (subscriptionType === 'OncaStandard') {
        subscriptionPrice = getSubscriptionPrice(subscriptionType);
    } else if (subscriptionType === 'OncaPremium') {
        subscriptionPrice = getSubscriptionPrice(subscriptionType);
    } else {
        //alert("Subscription type is not defined");
        $('#message').text("Error: subscription type is not defined");
        return;
    }

    // Get the info from the API server for the checkout page
    $.ajax({
        url: getUrl,
        type: 'GET',
        data: '',
        headers: {
            "Authorization": 'Bearer ' + localAuthToken
        },
        dataType: 'json',
        cache: false,
        beforeSend: function () {
            displayButtons(false);
            $("#processingModal").fadeIn();
        },
        success: function (responseJson) {
            if (responseJson) {
                if (responseJson.alertMessage) {
                    alert(responseJson.alertMessage);
                }
                if (responseJson.creditCards) {}
                if (responseJson.clientToken) {
                    clientToken = responseJson.clientToken;
                    braintree.client.create({
                        authorization: clientToken
                    }, function (err, clientInstance) {
                        if (err) {
                            $("#processingModal").fadeOut();
                            alert("Error1: " + err);
                            return;
                        }

                        braintree.vaultManager.create({
                                client: clientInstance
                            },
                            function (err, vm) {
                                if (err) {
                                    $("#processingModal").fadeOut();
                                    alert("Error2: " + err);
                                    return;
                                }
                                // Get all payment methods from the vault.
                                vm.fetchPaymentMethods(function (err, paymentMethods) {
                                    if (err) {
                                        $("#processingModal").fadeOut();
                                        alert("Error3: " + err);
                                        return;
                                    }
                                    if ((paymentMethods.length > 0) && (postUrl !== "addPaymentMethod")) {
                                        let idx = 0;
                                        existingPaymentMethodsCount = paymentMethods.length;
                                        existingPaymentMethodsView = true;
                                        $("#processingModal").fadeOut();
                                        selectDisplayPage("existing-payment-methods");
                                        displayButtons(true);
                                        // an array of payment methods
                                        paymentMethods.forEach(function (paymentMethod) {
                                            // Create a new div for each payment method and add the information to display to the user.
                                            element = $("<div id='cardFrame" + idx + "' class='cardFrame'></div>").appendTo('#payment-methods-details');
                                            let methodImage;
                                            if (paymentMethod.type === "PayPalAccount") {
                                                methodImage = $(element).append("<div class='existing-card-image' style='float: left;'></div>");
                                                $(methodImage).css('background-image', 'url("images/paypal.png")');
                                                $(methodImage).css('background-repeat', 'no-repeat');
                                                $(element).append("PayPal Account: ");
                                                $(element).append(paymentMethod.details.email);
                                            } else if (paymentMethod.type === "CreditCard") {
                                                if (paymentMethod.details.cardType) {
                                                    methodImage = $(element).append("<div class='existing-card-image' style='float: left;'></div>");
                                                    switch (paymentMethod.details.cardType) {
                                                        case 'Visa':
                                                            $(methodImage).css('background-image', 'url("images/CardVisa.svg")');
                                                            break;
                                                        case 'MasterCard':
                                                            $(methodImage).css('background-image', 'url("images/CardMasterCard.svg")');
                                                            break;
                                                        case 'American Express':
                                                            $(methodImage).css('background-image', 'url("images/CardAmEx.svg")');
                                                            break;
                                                        case 'Diners Club':
                                                            $(methodImage).css('background-image', 'url("images/CardDinersClub.svg")');
                                                            break;
                                                        case 'Discover':
                                                            $(methodImage).css('background-image', 'url("images/CardDiscover.svg")');
                                                            break;
                                                        case 'JCB':
                                                            $(methodImage).css('background-image', 'url("images/CardJCB.jpg")');
                                                            break;
                                                        case 'Maestro':
                                                            $(methodImage).css('background-image', 'url("images/CardMaestro.svg")');
                                                            break;
                                                        default:
                                                            $(methodImage).css('background-image', 'url("images/CardUnknown.svg")');
                                                            break;
                                                    }
                                                    $(methodImage).css('background-repeat', 'no-repeat');
                                                }
                                                $(element).append("Credit Card: ");
                                                $(element).append(paymentMethod.details.cardType + ", ");
                                                $(element).append("Ending with: " + paymentMethod.details.lastFour + " ");
                                            }
                                            $('<input type="hidden" id="existingNonce' + idx + '" class="existingNonce" value="' + paymentMethod.nonce + '" style="color:green; width: 900px;"/>').appendTo(element);
                                            idx++;
                                            // Add click event for each div
                                            $('.cardFrame').off().on("click", function (event) {
                                                // When user clicks on the payment method div change color and add ok glyphicon
                                                let children = $('#payment-methods-details').children();
                                                //alert("children: " + children.length);
                                                for (let i = 0; i < children.length; i++) {
                                                    // Change all children to default color and remove ok glyphicon
                                                    $(children[i]).css("border", "1px solid lightgray");
                                                    $(children[i]).find(".glyphicon.glyphicon-ok").hide();
                                                }
                                                $(this).css("border", "solid 3px green");
                                                $(this).prepend('<span class="glyphicon glyphicon-ok" style="color:green; margin-right:10px; float: right;"></span>');
                                                // Get the nonce of current payment method for using it if user is clicking on the submit button
                                                let cardNonce = $(this).find('.existingNonce').val();
                                                //alert("myNonce: " + cardNonce);
                                                existingNonce = cardNonce;
                                            });
                                        });
                                    } else { // No existing payment methods for this user just display new card page
                                        existingPaymentMethodsView = false;
                                        $("#processingModal").fadeOut();
                                        selectDisplayPage("hostedFields");
                                        displayButtons(true);
                                    }
                                });
                            });

                        braintree.hostedFields.create({
                            client: clientInstance,
                            styles: {
                                'input': {
                                    'color': '#282c37',
                                    'font-size': '16px',
                                    'transition': 'color 0.1s',
                                    'line-height': '3'
                                },
                                // Style the text of an invalid input
                                //'input.invalid': {
                                //'color': '#E53A40'
                                //},
                                //'input.valid': {
                                //'color': 'green'
                                //},
                                // placeholder styles need to be individually adjusted
                                '::-webkit-input-placeholder': {
                                    'color': 'rgba(0,0,0,0.6)'
                                },
                                ':-moz-placeholder': {
                                    'color': 'rgba(0,0,0,0.6)'
                                },
                                '::-moz-placeholder': {
                                    'color': 'rgba(0,0,0,0.6)'
                                },
                                ':-ms-input-placeholder': {
                                    'color': 'rgba(0,0,0,0.6)'
                                }
                            },
                            fields: {
                                number: {
                                    selector: '#card-number',
                                    placeholder: 'Card Number'
                                },
                                cvv: {
                                    selector: '#cvv',
                                    placeholder: '123'
                                },
                                expirationDate: {
                                    selector: '#expiration-date',
                                    placeholder: 'MM/YYYY'
                                },
                                postalCode: {
                                    selector: '#postal-code',
                                    placeholder: 'Postal Code'
                                }
                            }
                        }, function (err, hostedFieldsInstance) {
                            if (err) {
                                alert("Error4: " + err);
                                return;
                            }
                            hostedFieldsInstance.on('validityChange', function (event) {
                                let field = event.fields[event.emittedBy];
                                if (field.isValid) {
                                    if (event.emittedBy === 'expirationMonth' || event.emittedBy === 'expirationYear') {
                                        if (!event.fields.expirationMonth.isValid || !event.fields.expirationYear.isValid) {
                                            return;
                                        }
                                    } else {
                                        let elemId = $(field.container).attr('id');
                                        $('#' + elemId + '-msg').text('');
                                    }
                                    // Remove any previously applied error or warning classes
                                    $(field.container).parents('.form-group').removeClass('has-error');
                                    $(field.container).parents('.form-group').removeClass('has-success');
                                    // Apply styling for a valid field
                                    $(field.container).parents('.form-group').addClass('has-success');
                                } else if (field.isPotentiallyValid) {
                                    // Remove styling  from potentially valid fields
                                    $(field.container).parents('.form-group').removeClass('has-error');
                                    $(field.container).parents('.form-group').removeClass('has-success');
                                    let elemId = $(field.container).attr('id');
                                    $('#' + elemId + '-msg').text('');
                                } else if (!field.isPotentiallyValid) {
                                    // Add styling to invalid fields
                                    $(field.container).parents('.form-group').addClass('has-error');
                                    // Add helper text for an invalid card number
                                    // Change the top message based on the input error
                                    switch ($(field.container).attr('id')) {
                                        case 'card-number':
                                            $('#card-number-msg').text('Please check if you typed the correct card number.');
                                            break;
                                        case 'expiration-date':
                                            $('#expiration-date-msg').text('Please check your expiration date.');
                                            break;
                                        case 'cvv':
                                            $('#cvv-msg').text('Please check your security code.');
                                            break;
                                    }
                                } else {
                                    // Add styling to invalid fields
                                    $(field.container).parents('.form-group').addClass('has-error');
                                    // Add helper text for an invalid card number
                                    if (event.emittedBy === 'number') {
                                        $('#card-number-msg').text('Looks like this card number has an error.');
                                    }
                                }
                            });
                            hostedFieldsInstance.on('blur', function (event) {
                                let field = event.fields[event.emittedBy];
                                hostedFieldRequiredValidation(field);
                            });
                            hostedFieldsInstance.on('empty', function (event) {
                                let field = event.fields[event.emittedBy];
                                hostedFieldsEmptyEvent(field);
                            });
                            hostedFieldsInstance.on('notEmpty', function (event) {
                                let field = event.fields[event.emittedBy];
                                hostedFieldsNotEmptyEvent(field);
                            });
                            $(extraFieldsClass).on('blur', function (event) {
                                extraFieldRequiredValidation(this);
                            });
                            $(extraFieldsClass).on('input', function (event) {
                                extraFieldRequiredValidation(this);
                            });
                            hostedFieldsInstance.on('cardTypeChange', function (event) {
                                // Handle a field's change, such as a change in validity or credit card type
                                if (event.cards.length === 1) {
                                    //$('#card-type').text("With " + event.cards[0].niceType);
                                    $('#card-image').removeClass().addClass(event.cards[0].type);
                                    $('header').addClass('header-slide');

                                    // Change the CVV length for AmericanExpress cards
                                    if (event.cards[0].code.size === 4) {
                                        hostedFieldsInstance.setAttribute({
                                            field: 'cvv',
                                            attribute: 'placeholder',
                                            value: '1234'

                                        });
                                    } else {
                                        hostedFieldsInstance.setAttribute({
                                            field: 'cvv',
                                            attribute: 'placeholder',
                                            value: '123'
                                        });
                                    }
                                } else {
                                    hostedFieldsInstance.setAttribute({
                                        field: 'cvv',
                                        attribute: 'placeholder',
                                        value: '123'
                                    });
                                }
                            });
                            $('.panel-body').submit(function (event) {
                                event.preventDefault();
                                submit(event, hostedFieldsInstance);
                            });
                        });
                    });

                    $('#new-card-btn').off().on("click", function () {
                        existingNonce = null;
                        existingPaymentMethodsView = false;
                        selectDisplayPage("hostedFields");
                    });
                    $('#backToPaymentMethodsBtn').off().on("click", function () {
                        existingNonce = null;
                        existingPaymentMethodsView = true;
                        selectDisplayPage("existing-payment-methods");
                    });
                }
            }
        },
        error: function (xhr) {
            alert("Error while receiving data! Please try again or contact support!");
            $("#processingModal").fadeOut();
        },
        complete: function () {}
    });
}

function submit(event, hostedFieldsInstance) {
    let existingSubscriptionId = $('#subscription-id').val();
    // existingPaymentMethodsView is open
    if (existingPaymentMethodsView === true) {
        if (existingNonce) {
            // Update hidden nonce field in the form and submit to the server
            document.querySelector('#nonce').value = existingNonce;
            //displayButtons(false);
            paymentPost(postUrl, subscriptionType, subscriptionPrice, existingNonce, existingSubscriptionId);
        } else {
            alert("Please select from one of the existing payment methods below, or add a new payment method!");
        }
    } else { // existingPaymentMethodsView === false
        let errors = false;
        // Get hosted fields state
        let state = hostedFieldsInstance.getState();
        // Perform validation on hosted fields and extra fields
        errors = submitHostedFieldsValidation(state);
        errors = submitExtraFieldsValidation();
        if (errors) {
            alert("There are errors in the page, please review and fix!!");
            return;
        }
        hostedFieldsInstance.tokenize({
            cardholderName: event.target.cardholder_Name.value,
            billingAddress: {
                firstName: event.target.first_Name.value,
                lastName: event.target.last_Name.value,
                streetAddress: event.target.street_Address.value,
                locality: event.target.city.value,
                region: event.target.state.value,
                // https://developers.braintreepayments.com/reference/general/countries/ruby#list-of-countries
                countryCodeAlpha2: event.target.country.value
            }
        }, function (tokenizeErr, payload) {
            if (tokenizeErr) {
                displayButtons(true);
                switch (tokenizeErr.code) {
                    //case 'HOSTED_FIELDS_FIELDS_EMPTY':
                    // occurs when none of the fields are filled in
                    //alert('All fields are empty! Please fill out the form.');
                    //break;
                    case 'HOSTED_FIELDS_FIELDS_INVALID':
                        // occurs when certain fields do not pass client side validation
                        alert("Some fields are invalid: " + tokenizeErr.details.invalidFieldKeys);
                        break;
                    case 'HOSTED_FIELDS_TOKENIZATION_FAIL_ON_DUPLICATE':
                        // occurs when:
                        //   * the client token used for client authorization was generated
                        //     with a customer ID and the fail on duplicate payment method
                        //     option is set to true
                        //   * the card being tokenized has previously been vaulted (with any customer)
                        // See: https://developers.braintreepayments.com/reference/request/client-token/generate/#options.fail_on_duplicate_payment_method
                        alert('This payment method already exists.');
                        break;
                    case 'HOSTED_FIELDS_TOKENIZATION_CVV_VERIFICATION_FAILED':
                        // occurs when:
                        //   * the client token used for client authorization was generated
                        //     with a customer ID and the verify card option is set to true
                        //     and you have credit card verification turned on in the Braintree
                        //     control panel
                        //   * the cvv does not pass verfication (https://developers.braintreepayments.com/reference/general/testing/#avs-and-cvv/cid-responses)
                        // See: https://developers.braintreepayments.com/reference/request/client-token/generate/#options.verify_card
                        alert('CVV did not pass verification');
                        break;
                    case 'HOSTED_FIELDS_FAILED_TOKENIZATION':
                        // occurs for any other tokenization error on the server
                        alert('Validation failed server side. Is the card valid?');
                        break;
                    case 'HOSTED_FIELDS_TOKENIZATION_NETWORK_ERROR':
                        // occurs when the Braintree gateway cannot be contacted
                        alert('Network error occurred.');
                        break;
                    default:
                        alert('Server error');
                }
            } else {
                // Update hidden nonce field in the form and submit to the server
                //document.querySelector('#nonce').value = payload.nonce
                alert("payload.nonce: " + payload.nonce);
                //displayButtons(false);
                paymentPost(postUrl, subscriptionType, subscriptionPrice, payload.nonce, existingSubscriptionId);
            }
        });
    }
}

function selectDisplayPage(pageName) {
    if (pageName === "hostedFields") {
        $('.panel-title').text("Enter Card Details");
        $('#existing-payment-methods').attr("style", "display: none");
        $('#hostedFields').attr("style", "display: block");
        if (existingPaymentMethodsCount > 0) {
            $('#backToPaymentMethodsBtn').attr("style", "display: block");
        } else {
            $('#backToPaymentMethodsBtn').attr("style", "display: none");
        }
        $('#message').text("");
    } else if (pageName === "existing-payment-methods") {
        $('.panel-title').text("Existing Payment Methods");
        $('#hostedFields').attr("style", "display: none");
        $('#existing-payment-methods').attr("style", "display: block");
        $('#message').text("Select from the existing payment methods below or add a new payment method.");
    }
}

function displayButtons(display) {
    if (display === true) {
        $('#submit-button').show();
        $('#cancel-button').show();
        $('#paypal-button').show();
    } else {
        $('#submit-button').hide();
        $('#cancel-button').hide();
        $('#paypal-button').hide();
    }
}

function extraFieldRequiredValidation(elem) {
    let elemId = elem.id;
    let elemVal = $("#" + elemId).val();
    let elemName = $("#" + elemId).attr('name');
    let elemTitle = $("#" + elemId).attr('title');
    let errors = false;

    // If current field is country and val is USA, add state field and mark it as required
    if (elemId === 'country') {
        if (elemVal === 'US') {
            $('#stateDiv').fadeIn("slow");
            $('#state').attr("title", "Required");
        } else {
            $('#stateDiv').fadeOut("slow");
            $('#state').attr("title", "");
        }
    }
    //Check if fields are empty or not
    if (elem.tagName === 'INPUT') {
        if ((elemTitle === 'Required') && (elemVal.length < 1)) {
            $('#' + elemId + '-msg').text(elemName + ' is required.');
            $('#' + elemId).parents('.form-group').removeClass('has-success');
            $('#' + elemId).parents('.form-group').addClass('has-error');
            errors = true;
        } else {
            $('#' + elemId + '-msg').text('');
            $('#' + elemId).parents('.form-group').removeClass('has-error');
            $('#' + elemId).parents('.form-group').addClass('has-success');
        }
    } else if (elem.tagName === 'SELECT') {
        if ((elemTitle === 'Required') && (elemVal === null)) {
            $('#' + elemId + '-msg').text('Please select a ' + elemName);
            $('#' + elemId).parents('.form-group').removeClass('has-success');
            $('#' + elemId).parents('.form-group').addClass('has-error');
            errors = true;
        } else {
            $('#' + elemId + '-msg').text('');
            $('#' + elemId).parents('.form-group').removeClass('has-error');
            $('#' + elemId).parents('.form-group').addClass('has-success');
        }
    }
    return errors;
}

function submitExtraFieldsValidation() {
    let errors = false;
    let rv = false;
    let elements = $('.extra-field');
    for (let i = 0; i < elements.length; i++) {
        let elem = elements[i];
        rv = extraFieldRequiredValidation(elem);
        if (rv === true) {
            errors = true;
        }
    }
    return errors;
}

function hostedFieldRequiredValidation(field) {
    // Check if required field is empty and if yes diplay an error
    let fieldId = $(field.container).attr('id');
    let fieldName = $(field.container).attr('name');
    if (field.isPotentiallyValid) {
        if (field.isEmpty) {
            $('#' + fieldId + '-msg').text(fieldName + ' is required.');
            $(field.container).parents('.form-group').addClass('has-error');
            $('#card-image').removeClass();
        }
    }
}

function submitHostedFieldsValidation(state) {
    let elements = document.getElementsByClassName("hosted-field");
    let errors = false;
    let fieldName = '';

    for (let i = 0; i < elements.length; i++) {
        let elem = elements[i];
        let elemId = elem.id;
        let displayName = '';
        switch (elemId) {
            case 'card-number':
                fieldName = 'number';
                displayName = 'Card Number';
                break;
            case 'expiration-date':
                fieldName = 'expirationDate';
                displayName = 'Expiration Date';
                break;
            case 'cvv':
                fieldName = 'cvv';
                displayName = 'CVV';
                break;
            case 'postal-code':
                fieldName = 'postalCode';
                displayName = 'Postal Code';
                break;
        }
        if (state.fields[fieldName].isPotentiallyValid) {
            if (state.fields[fieldName].isEmpty) {
                $('#' + elemId + '-msg').text(displayName + ' is required.');
                $('#' + elemId).parents('.form-group').removeClass('has-success');
                $('#' + elemId).parents('.form-group').addClass('has-error');
                errors = true;
            } else {
                $('#' + elemId + '-msg').text('');
                $('#' + elemId).parents('.form-group').removeClass('has-error');
            }
        }
    }
    return errors;
}

function hostedFieldsEmptyEvent(field) {
    // If an empty field is 'isPotentiallyValid' and required display an error
    let fieldId = $(field.container).attr('id');
    let fieldName = $(field.container).attr('name');
    if (field.isPotentiallyValid) {
        $('#' + fieldId + '-msg').text(fieldName + ' is required.');
        $(field.container).parents('.form-group').addClass('has-error');
        $('#card-image').removeClass();
    }
}

function hostedFieldsNotEmptyEvent(field) {
    // // If an empty field is 'isPotentiallyValid' and required clear require field error
    let fieldId = $(field.container).attr('id');
    if (field.isPotentiallyValid) {
        $('#' + fieldId + '-msg').text('');
        $(field.container).parents('.form-group').removeClass('has-error');
        $(field.container).parents('.form-group').removeClass('has-success');
    }
}

function handlePayment() {
    displayPaymentForm();
}

$(handlePayment);
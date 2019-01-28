
'use strict';

let subscriptionPrice;
let currentInstance;

function displayPaymentForm() {
    let inUrl = window.location;
    let url = "/checkouts/new";
    //let udbId = document.getElementById('udbId').value;
    //let postData = {"udbId": udbId};
    let clientToken;

    $('#submit-button').hide();
    $('#cancel-button').hide();

    let subscriptionType = getQueryVariable(inUrl, 'subType');
    if (subscriptionType === 'MonthlyPlan') {
        subscriptionPrice = getSubscriptionPrice(subscriptionType);
    }
    else if (subscriptionType === 'YearlyPlan') {
        subscriptionPrice = getSubscriptionPrice(subscriptionType);
    }
    else {
        //alert("Subscription type is not defined");
        $('#message').text("Error: subscription type is not defined");
        return;
    }

    $.ajax({
        url: url,
        type: 'GET',
        data: '',
        dataType: 'json',
        cache: false,
        beforeSend: function () {
            $('#message').text("Please Wait...");
            $('#submit-button').hide();
            $('#cancel-button').hide();
        },
        success: function (responseJson) {
            if (responseJson) {
                if (responseJson.clientToken) {
                    $('#message').text("");
                    $('#submit-button').show();
                    $('#cancel-button').show();
                    clientToken = responseJson.clientToken;
                    braintree.dropin.create({
                        authorization: clientToken,
                        container: '#dropin-container',
                        // Override some card fields
                        card: {
                            // Display card holder field
                            cardholderName: {
                                required: true
                            },
                            overrides: {
                                fields: {
                                    number: {
                                        placeholder: 'Card Number' // Update the number field placeholder
                                    },
                                    cvv: {
                                        placeholder: 'CVV'
                                    },
                                    postalCode: {
                                        placeholder: 'Postal Code'
                                    }
                                }
                            }
                        },
                        // Display paypal payment options
                        paypal: {
                            flow: 'checkout'
                        },
                        options: {
                            defaultFirst: 'true'
                        },
                        paypalCredit: {
                            flow: 'checkout'
                        }
                    }, function (createErr, instance) {
                        if (createErr) {
                            $('#submit-button').hide();
                            // Handle any errors that might've occurred when creating Drop-in
                            alert(createErr);
                            return;
                        }

                        // Save the current instance info.
                        currentInstance = instance;
                    });
                }
            }
        },
        error: function (xhr) {
            //alert("Error: " + xhr.responseText); // For debug only!!!
            alert("Error while receiving data! Please try again or contact support!");
        },
        complete: function () {
            $('#message').text("");
        }
    });
};

$('.post-payment').submit(event => {
    event.preventDefault();
    currentInstance.requestPaymentMethod(function (err, payload) {
        if (err) {
            alert(err);
            return;
        }
        $('#submit-button').hide();
        $('#cancel-button').hide();

        paymentPost("/checkouts", subscriptionPrice, payload.nonce)
    });
});

function handlePayment() {
    //alert("payment-page!!!");
    displayPaymentForm();
}

$(handlePayment);
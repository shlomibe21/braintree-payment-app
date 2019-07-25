'use strict';

// If user is not authenticated go to login page
if (!localAuthToken) {
    window.location.href = "/login.html";
}

const OncaBasicPrice = '20.00';
const OncaStandardPrice = '30.00';
const OncaPremiumPrice = '40.00';

function getSubscriptionPrice(subscriptionType) {
    switch (subscriptionType) {
        case 'OncaBasic':
            return OncaBasicPrice;
        case 'OncaStandard':
            return OncaStandardPrice;
        case 'OncaPremium':
            return OncaPremiumPrice;
        default:
            return OncaBasicPrice;
    }
}

function paymentRequest(subscriptionType) {
    let subscriptionId = $('#subscription-id').val();
   
    const postData = { subscriptionType: subscriptionType, subscriptionId: subscriptionId };
    alert("paymentRequest!!! " + "subscriptionType: " + subscriptionType + ": " + subscriptionId);
    event.preventDefault();
    $.ajax({
        url: "/subscription",
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(postData),
        success: function (data) {
            //window.location.href = 'braintree-checkout-dropin.html?subType=' + subscriptionType;
            window.location.href = 'braintree-checkout-hosted-fields.html?subType=' + subscriptionType;
        },
        error: function (error) {
            console.log('error', error);
        },
    });
}

function paymentPost(url, subscriptionType, amount, nonce, subscriptionId) {
     // Fetch all the the data from the form
     //let fields = $("#checkout").serializeArray();
    $.ajax({
        url: url,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ amount: amount, payment_method_nonce: nonce, subscriptionId: subscriptionId }),
        headers: {
            "Authorization": 'Bearer ' + localAuthToken
        },
        success: function (data) {
            if (data) {
                if (data.subscription && data.subscription.id && data.subscription.planId) {
                    addNewSubscription(data.subscription.id, data.subscription.planId);
                }
            }
            // Upon success go back to subscription page.
            if (data && data._id) {
                let id = data._id;
                if (id) {
                    alert("Congratulations! Your subscription to the " + subscriptionType + " Plan was successful. ")
                    window.location.href = "subscriptions-page.html";
                }
            }
            else {
                // in case of a problem go back to subscription page.
                // TODO: In case of a problem with the data go to error page (doesn't exist yet!)
                window.location.href = "subscriptions-page.html";
            }

        },
        error: function (error) {
            console.log('error', error);
            if (error) {
                if (error.responseJSON && error.responseJSON.message) {
                    alert(error.responseJSON.message);
                }
                else {
                    alert("Error: payment for subscription failed");
                }
            }
        },
    });
}
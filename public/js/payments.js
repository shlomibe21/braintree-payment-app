'use strict';

const MonthlyPlanPrice = '20.00';
const YearlyPlanPrice = '200.00';

function getSubscriptionPrice(subscriptionType) {
    switch (subscriptionType) {
        case 'MonthlyPlan':
            return MonthlyPlanPrice;
        case 'YearlyPlan':
            return YearlyPlanPrice;
        default:
            return MonthlyPlanPrice;
    }
}

function paymentRequest(subscriptionType) {
    //alert("paymentRequest!!! " + "subscriptionType: " + subscriptionType);
    event.preventDefault();
    $.ajax({
        url: "/subscription",
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ subscriptionType: subscriptionType }),
        success: function (data) {
            //window.location.href = 'braintree-checkout-dropin.html?subType=' + subscriptionType;
            window.location.href = 'braintree-checkout-hosted-fields.html?subType=' + subscriptionType;
        },
        error: function (error) {
            console.log('error', error);
        },
    });
}

function paymentPost(url, amount, nonce) {
    $.ajax({
        url: url,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ amount: amount, payment_method_nonce: nonce }),
        /*headers: {
            "Authorization": 'Bearer ' + localAuthToken
        },*/
        success: function (data) {
            // Upon success go back to project-list page, in case
            // of a problem with data just go back to projects list.
            if (data && data.id) {
                let id = data.id;
                if (id) {
                    //window.location.href = "project-read.html?id=" + id;
                }
            }
            else {
                //window.location.href = "projects-list.html";
            }

        },
        error: function (error) {
            console.log('error', error);
            const message = error.responseJSON.message;
            alert(message);
        },
    });
}
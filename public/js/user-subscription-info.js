'use strict';

// If user is not authenticated go to login page
if (!localAuthToken) {
    window.location.href = "/login.html";
}

function userSubscriptionInfo(data) {
    if ((!data) || (!data.subscriptions) || (data.subscriptions.length === 0)) {
        return;
    }
    const template = `<h1>Subscription Info</h1>`;
    $('#currentSubscriptionInfo').html(template);
}

// Get subscriptions list
function getUserSubscriptionInfo(callbackFn) {
    let url = 'http://localhost:8080/checkout/subscriptionInfoWithCustomerId';

    axios.get(url, {
            headers: {
                // Provide user's auth token as credentials
                "Authorization": 'Bearer ' + localAuthToken,

            }
        })
        .then(function (data) {
            // Here you get the data to modify as you please
            callbackFn
        }).catch(function (error) {
            // If there is any error you will catch them here
        });

    /*$.ajax({
        url: "/checkout/subscriptionInfoWithCustomerId",
        type: 'GET',
        contentType: 'application/json',
        headers: {
            "Authorization": 'Bearer ' + localAuthToken
        },
        success: function (data) {
            callbackFn
        },
        error: function (error) {
            console.log('error', error);
        }
    });*/
}

function handleDisplayUserSubscription() {
    getUserSubscriptionInfo(userSubscriptionInfo);

}

$(handleDisplayUserSubscription);
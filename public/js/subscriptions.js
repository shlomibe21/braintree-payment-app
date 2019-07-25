'use strict';

//let itemId;

// If user is not authenticated go to login page
if (!localAuthToken) {
    window.location.href = "/login.html";
}

// Get subscriptions list
function getSubscriptionsList(callbackFn) {
    $.ajax({
        url: "/subscription/subscription-db",
        type: 'GET',
        contentType: 'application/json',
        headers: {
            "Authorization": 'Bearer ' + localAuthToken
        },
        success: callbackFn,
        error: function (error) {
            console.log('error', error);
        }
    });
}

function displaySubscriptionsList(data) {
    if((!data) || (!data.subscriptions) || (data.subscriptions.length === 0)) {
        return;
    }

    let debug = data.subscriptions[0].user;
    // User can have only one active subscription!
    // Add it to an hidden input in the page
    alert('subscriptionId: ' + data.subscriptions[0].subscriptionId);
    let template = `
    <input type="hidden" id="subscription-id" name="subscription-id" value=${data.subscriptions[0].subscriptionId}></input>    
    `;
    $('.js-fields').html(template);
}

function addNewSubscription(subscriptionId, subscriptionType) {
    let postData = { "subscriptionId": subscriptionId, "subscriptionType": subscriptionType };
    event.preventDefault();
    $.ajax({
        url: "/subscription/subscription-db",
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(postData),
        headers: {
            "Authorization": 'Bearer ' + localAuthToken
        },
        success: function (data) {
            // Upon success go back to project-list page, in case
            // of a problem with data just go back to projects list.
            /*if (data && data.id) {
                let id = data.id;
                if (id) {
                    window.location.href = "project-read.html?id=" + id;
                }
            }
            else {
                window.location.href = "projects-list.html";
            }*/

        },
        error: function (error) {
            console.log('error', error);
        },
    });
}

/*function displayProjectInfo(data) {
    // Display header info
    let headerInfo = projectHeaderUpdateTemplate(data)
    $('.js-projects-info').append(headerInfo);

    if ((data.tasks) && ((data.tasks.length > 0))) {
        // Display tasks info
        let tasksInfo = data.tasks.map((task) => projectTasksUpdateTemplate(task));
        let tasksTemplate = `
        <section role="region" class="js-tasks">
        <legend class="tasks-title">Tasks:</legend>
        <ul role="list">${tasksInfo.join("")}</ul>
        </section>
        `;
        $('.js-projects-info').append(tasksTemplate);
    }
}

function getSubscriptionInfo() {
    // Get current url
    const url = window.location.search;
    // Get the id of the selected project from the url
    itemId = getParamValFromUrl(url, 'id');
    if (!itemId) {
        alert('Project id is missing');
        return;
    }
    getProjectInfo(displayProjectInfo, itemId);
    displayTimer();
}*/

function handleSubscription() {
    getSubscriptionsList(displaySubscriptionsList);
}

$(handleSubscription);
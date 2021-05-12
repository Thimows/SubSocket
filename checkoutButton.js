/**
 * Copyright SubSocket.io
 * Version 1.1.6
 */

function SubSocketButton(checkoutID, versionTest = false, config, elementID, application) {

  if (document.querySelector('#' + elementID + ' .paypal-buttons') !== null) {

    document.querySelector('#' + elementID + ' .paypal-buttons').innerHTML = ''
  }

  var versionTest
  if (versionTest) {
    verstionTest = 'version-test'
  } else {
    verstionTest = 'version-live'
  }

  //Recieve checkout details from SubSocket
  fetch(
      `${"https://www.subsocket.io/"+verstionTest+"/api/1.1/obj/checkout/" + checkoutID}`
    )
    .then(function(response) {
      // The API call was successful!
      return response.json();
    })
    .then(function(data) {
      // This is the JSON from our response
      if (document.querySelector('#' + elementID + ' .paypal-buttons') == null) {
        setTimeout(function() {
          renderButton(data.response);
        }, 1)
      }
    })
    .catch(function(err) {
      // There was an error
      console.warn(
        "Something went wrong with retrieving the Checkout details from SubSocket.",
        err
      );
    });


  const renderButton = (response) => {
    paypal
      .Buttons({

        style: config.style,

        createSubscription: function(data, actions) {
          return actions.subscription.create({
            plan_id: response["Plan ID"]
          });
        },

        onApprove: function(data, actions) {
          subscriptionSuccesful(response, data.subscriptionID)
        },

        onError: function(err) {
          // For example, redirect to a specific error page
          console.log(err)
        }
      })
      .render("#" + elementID);
  };

  const subscriptionSuccesful = (response, subscriptionID) => {

    createSubscription(response, subscriptionID)
  }

  const createSubscription = (response, subscriptionID) => {

    var body = JSON.stringify({
      "Checkout": checkoutID,
      "Subscription ID": subscriptionID,
      "Application": application,
      "Sandbox mode": response['Sandbox mode'],
      "Status": 'success',
      //"Subscription detail (object)": data,
      "User name": "",
      "User email": "",
      "Plan ID": response['Plan ID'],
      "Status (subscription object)": 'SUCCESS',
      "Log": "Created using SubSocket button"
    })

    //POST API call to create subscription inside SubSocket
    fetch(`${"https://www.subsocket.io/"+verstionTest+"/api/1.1/obj/Subscriptions"}`, {
        method: 'POST',
        body: body, // The data
        headers: {
          'Content-type': 'application/json' // The type of data you're sending
        }
      })

      .then(function(result) {
        // The API call was successful!
        console.log("Subscription successfully created in SubSocket")
        actionSuccessful(response, subscriptionID)
      })

      .catch(function(err) {
        // There was an error
        console.warn(
          "Something went wrong with creating the subsciption in SubSocket.",
          err
        );
      });


    const actionSuccessful = (response, subscriptionID) => {
      //Redirect user to success URL
      var successURL = response['Succes URL']

      var url = new URL(successURL);
      var lengthURLParameters = Array.from(url.searchParams).length

      var finalURL
      if (lengthURLParameters == 0) {
        finalURL = successURL + '?subscription_id=' + subscriptionID + '&checkout_id=' + checkoutID
      } else if (lengthURLParameters > 0){
        finalURL = successURL + '&subscription_id=' + subscriptionID + '&checkout_id=' + checkoutID
      }
      console.log('Redirecting to', finalURL)
      window.location.href = finalURL;
    }
  }
}

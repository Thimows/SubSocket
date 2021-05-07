  function SubSocketButton(checkoutID, versionTest = false, config, elementID) {

    if (document.querySelector('#'+elementID+' .paypal-buttons') == null) {

      if (versionTest) {
        var verstionTest = 'version-test'
        }else {
          var verstionTest = 'version-live'
          }

      fetch(
        `${"https://www.subsocket.io/"+verstionTest+"/api/1.1/obj/checkout/" + checkoutID}`
      )
        .then(function (response) {
        // The API call was successful!
        return response.json();
      })
        .then(function (data) {
        // This is the JSON from our response
        renderButton(data.response);
      })
        .catch(function (err) {
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

          createSubscription: function (data, actions) {
            return actions.subscription.create({
              plan_id: response["Plan ID"]
            });
          },

          onApprove: function (data, actions) {
            subscriptionSuccesful(response, data.subscriptionID)
          },

          onError: function (err) {
            // For example, redirect to a specific error page
            console.log(err)
            window.location.href = response['Cancel URL'];
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
          "Application": response['Application'],
          "Sandbox mode": response['Sandbox mode'],
          "Status": 'success',
          //"Subscription detail (object)": data,
          "User name": "Click to load",
          "User email": "Click to load",
          "Plan ID": response['Plan ID'],
          "Status (subscription object)": 'SUCCESS',
          "Log" : "Created using SubSocket button"
        })

        //POST API call to create subscription inside SubSocket
        fetch(`${"https://www.subsocket.io/"+verstionTest+"/api/1.1/obj/Subscriptions"}`, {
          method: 'POST',
          body: body, // The data
          headers: {
            'Content-type': 'application/json' // The type of data you're sending
          }
        })     
          .then(function (response) {
          // The API call was successful!
          console.log("Subscription successfully created in SubSocket")
        })
          .catch(function (err) {
          // There was an error
          console.warn(
            "Something went wrong with creating the subsciption in SubSocket.",
            err
          );
        });
      }
    }
  } 

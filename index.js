const express = require('express');
const bodyParser = require('body-parser');
const https = require("https");
const mongoose = require('mongoose');
const stripe = require('stripe')('sk_test_9CFc5MnuS0BuLis2WR3vhMjA');
const moment = require('moment');

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true})); //to make bodyParser work.
app.use(express.static(__dirname+"/public")); //Static file where CSS and Images go.. files in here will appear in root of html eg.   <link href="css/sign-in.css" rel="stylesheet">
//html part looks like this  <link href="css/sign-in.css" rel="stylesheet"

const YOUR_DOMAIN = 'http://localhost:3000';

app.get("/", function(req,res){

  // res.render('success', {}) //send params here.

   res.render('index', {}) //send params here.
    
});

app.get("/paymentSuccess", async (req,res) =>{

  
  
    const session = await stripe.checkout.sessions.retrieve(req.query.session_id);
    if(session.payment_status==='paid'){
      
      const sessionData =  JSON.parse(req.query.order_id)

      const SUCCESSFUL_ORDER = {
        fullName : sessionData.fullName,
        phoneNumber : sessionData.phoneNumber,
        orderWebsite: sessionData.orderWebsite,
        orderNumber: sessionData.orderNumber,
        goodsCatagory: sessionData.goodsCatagory,
        invoiceValueMyr: sessionData.invoiceValueMyr,
        shippingAgent: sessionData.shippingAgent,
        trackingNumber: sessionData.trackingNumber,
        importTaxRate: sessionData.importTaxRate,
        exchangeRate: sessionData.exchangeRate,  //EXCHANGE RATE HERE
        importTaxBndCents: sessionData.importTaxBndCents,
        customerEmail: session.customer_details.email,
        createdUnixTimestamp: session.created,
        collectionPoint: sessionData.collectionPoint,
        serviceFeeBndCents: sessionData.serviceFeeBndCents,
        importTaxBndCents: sessionData.importTaxBndCents
      }

      console.log(SUCCESSFUL_ORDER);
      res.render('success', {SUCCESSFUL_ORDER:SUCCESSFUL_ORDER, moment:moment}) //send params here.


    }
    // const customer = await stripe.customers.retrieve(session.customer);


    
});

app.get("/paymentCancelled", function(req,res){

    
    res.render('index', {}) //send params here.
    alert("Payment Cancelled.")
    
});

app.get("/miricollect", function(req,res){

    res.render('miriCollect', {}) //send params here.
    
});

app.get("/bruneicollect", function(req,res){

    res.render('bruneiCollect', {}) //send params here.
    
});

app.post("/registerOrder", async (req,res) =>{


    const taxRates = new Map([
        ["Tyre", 0.05],
        ["Auto Parts", 0.05],
        ["Industrial Machine", 0.025],
        ["Leather and Fur Products",0.05],
        ["Hair Products",0.05],
        ["Video Games", 0.20],
        ["Precious Metals", 0.15],
        ["Jewellery", 0.15],
        ["Candy", 0.03],
        ["MSG", 0.30],
        ["Instant Coffee & Tea",0.05],
        ["Mobile Phone", 0.10],
        ["Digital Camera",0.10],
        ["Electrical Goods",0.05],
        ["Plastic Product",0.03],
        ["Rubber Product",0.05],
        ["Watch or Accessories",0.10],
        ["Cosmetics, Beauty and Perfume Product",0.05],
        ["Textile Carpet and Flooring",0.05],
        ["Photography Products",0.05],
        ["Hat, Helmet, Headgear",0.10],
        ["Lighter",0.10],
        ["Decorative Hair Pin",0.10],
        ["Other",0.10]
      ]);

    let NEW_ORDER = {
        fullName : req.body.inptFullName,
        phoneNumber : req.body.inptPhoneNumber,
        orderWebsite: req.body.inptOrderWebsite,
        orderNumber: req.body.inptOrderNumber,
        goodsCatagory: req.body.slctGoodsCatagory,
        invoiceValueMyr: req.body.inptInvoiceValueMyr,
        shippingAgent: req.body.inptShippingAgent,
        trackingNumber: req.body.inptTrackingNumber,
        importTaxRate: taxRates.get(req.body.slctGoodsCatagory),
        exchangeRate: 3.2,  //EXCHANGE RATE HERE
        collectionPoint: "Default",
        serviceFeeBndCents: 0

    }



    
    if(req.body.flexRadioDefault==0){ //collect in Miri

      NEW_ORDER['collectionPoint'] = 'Miri';
      NEW_ORDER['serviceFeeBndCents'] = 300;
      NEW_ORDER['importTaxBndCents'] = 0;
      const JSON_NEW_ORDER = JSON.stringify(NEW_ORDER);

        const myProduct = await stripe.products.create({
            name: 'One Package, Collect in Miri',
            description: 'PLEASE CONFIRM THE FOLLOWING DETAILS: \n' +
            '| Full Name: ' + NEW_ORDER.fullName +'\n' +
            '| Phone Number: ' + NEW_ORDER.phoneNumber +'\n' +
            '| Order Website: '+ NEW_ORDER.orderWebsite +'\n' +
            '| Order Number: ' + NEW_ORDER.orderNumber +'\n' +
            '| Shipping Agent: ' + NEW_ORDER.shippingAgent +'\n' +
            '| Tracking Number: ' + NEW_ORDER.trackingNumber 
        });

        const myPrice =  await stripe.prices.create({
         unit_amount: 300,
         currency: 'bnd',
         product: myProduct.id,
        });

        const session = await stripe.checkout.sessions.create({
            line_items: [
              {
                // Provide the exact Price ID (for example, pr_1234) of the product you want to sell
                price: myPrice.id,
                quantity: 1,
              },
            ],
            mode: 'payment',
            success_url: `${YOUR_DOMAIN}/paymentSuccess?session_id={CHECKOUT_SESSION_ID}&order_id=${JSON_NEW_ORDER}`,
            cancel_url: `${YOUR_DOMAIN}/paymentCancelled`,
          });
        //   console.log(res);
        res.redirect(303, session.url);

    } else { //collect in Brunei

      NEW_ORDER['collectionPoint'] = 'Jerudong';
      NEW_ORDER['serviceFeeBndCents'] = 500;
      NEW_ORDER['importTaxBndCents']= Math.round(100*taxRates.get(NEW_ORDER.goodsCatagory)*NEW_ORDER.invoiceValueMyr/NEW_ORDER.exchangeRate);
      const JSON_NEW_ORDER = JSON.stringify(NEW_ORDER);


        const myProduct = await stripe.products.create({
            name: 'One Package, Collect in Jerudong',
            description: 'PLEASE CONFIRM THE FOLLOWING DETAILS: \n' +
            '| Full Name: ' + NEW_ORDER.fullName +'\n' +
            '| Phone Number: ' + NEW_ORDER.phoneNumber +'\n' +
            '| Order Website: '+ NEW_ORDER.orderWebsite +'\n' +
            '| Order Number: ' + NEW_ORDER.orderNumber +'\n' +
            '| Goods Catagory: ' + NEW_ORDER.goodsCatagory +'\n' +
            '| Invoice Value: ' + NEW_ORDER.invoiceValueMyr +'\n' +
            '| Shipping Agent: ' + NEW_ORDER.shippingAgent +'\n' +
            '| Tracking Number: ' + NEW_ORDER.trackingNumber
        });

        const myPrice =  await stripe.prices.create({
         unit_amount: 500,
         currency: 'bnd',
         product: myProduct.id,
        });

        const myTaxProduct = await stripe.products.create({
            name: 'Import Tax',
            description: 
            '| Goods Catagory: ' + NEW_ORDER.goodsCatagory +'\n' +
            '| Invoice Value (MYR): ' + NEW_ORDER.invoiceValueMyr +'\n'
        });

        const myTaxPrice =  await stripe.prices.create({
            unit_amount: NEW_ORDER.importTaxBndCents,
            currency: 'bnd',
            product: myTaxProduct.id,
           });
           
        const session = await stripe.checkout.sessions.create({
            line_items: [
              {
                // Provide the exact Price ID (for example, pr_1234) of the product you want to sell
                price: myPrice.id,
                quantity: 1,
              },
              {
                price: myTaxPrice.id,
                quantity: 1,
              }
            ],
            mode: 'payment',
            success_url: `${YOUR_DOMAIN}/paymentSuccess?session_id={CHECKOUT_SESSION_ID}&order_id=${JSON_NEW_ORDER}`,
            cancel_url: `${YOUR_DOMAIN}/paymentCancelled`,
          });
        //   console.log(res);
        res.redirect(303, session.url);

    }
    console.log(NEW_ORDER);
    console.log(req.body.flexRadioDefault);
});


app.listen(process.env.PORT || 3000, function(){
    console.log("server started on port 3000!");
});

//


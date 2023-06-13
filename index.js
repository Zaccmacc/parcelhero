const express = require('express');
const bodyParser = require('body-parser');
const https = require("https");
const mongoose = require('mongoose');
const stripe = require('stripe')('sk_test_9CFc5MnuS0BuLis2WR3vhMjA');
const moment = require('moment');
const nodemailer = require('nodemailer');
const fs = require('fs');
const ejs = require('ejs');
const multer = require("multer");


const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true})); //to make bodyParser work.
app.use(express.static(__dirname+"/public")); //Static file where CSS and Images go.. files in here will appear in root of html eg.   <link href="css/sign-in.css" rel="stylesheet">
//html part looks like this  <link href="css/sign-in.css" rel="stylesheet"

const YOUR_DOMAIN = 'http://localhost:3000';

// const upload = multer(getMulterParams()).single("myPdfInvoice");
const upload = multer({
  dest: "uploads/",
  limits : {fileSize : 10000000},
});

app.get("/", function(req,res){


   res.render('index', {}) //send params here.
    
});

app.get("/paymentSuccess", async (req,res) =>{

  

  
  
    const session = await stripe.checkout.sessions.retrieve(req.query.session_id);
    if(session.payment_status==='paid'){
      
      const sessionData =  JSON.parse(req.query.order_id)

      let SUCCESSFUL_ORDER = {
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

      if(SUCCESSFUL_ORDER.collectionPoint=='Miri'){
        SUCCESSFUL_ORDER.collectionPointAddress1 = 'Parcel Hero'
        SUCCESSFUL_ORDER.collectionPointAddress2 = 'Lot 1564, Permyjaya Technology Park'
        SUCCESSFUL_ORDER.collectionPointAddress3 = 'Tudan, 98000, Miri, Sarawak'
      } else {
        SUCCESSFUL_ORDER.collectionPointAddress1 = 'Parcel Hero'
        SUCCESSFUL_ORDER.collectionPointAddress2 = 'Lot 1564, Permyjaya Technology Park'
        SUCCESSFUL_ORDER.collectionPointAddress3 = 'Tudan, 98000, Miri, Sarawak'
      }

      

      res.render('success', {SUCCESSFUL_ORDER:SUCCESSFUL_ORDER, moment:moment}); //send params here.

      const transporter = nodemailer.createTransport({
        host: 'mail.parcelhero.my',
        port: '465', // must be 587 for gmail
        auth: {
          user: 'info@parcelhero.my',
          pass: 'parcelheroparcelhero'
        }
      })

      console.log( "query pdf path: " + req.query.pdf_path);
      
      var mailOptionsCustomer = {
        from: 'info@parcelhero.my',
        to: SUCCESSFUL_ORDER.customerEmail,
        subject: 'Parcel Hero Order',
        html: await ejs.renderFile(__dirname +  "/views/successEmail.ejs", { SUCCESSFUL_ORDER: SUCCESSFUL_ORDER, moment: moment }),
        attachments: [{
          filename: 'customer_invoice.pdf',
          path: req.query.pdf_path,
          contentType: 'application/pdf'
        }],   
      };


      //////////// SET THE RECEIVERS ///////////////////
      // var mailOptionsCompany = {
      //   from: 'info@parcelhero.my',
      //   to: 'yasmin@waterworthservices.com',
      //   subject: 'Sending Email using Node.js',
      //   html: await ejs.renderFile(__dirname +  "/views/successEmail.ejs", { SUCCESSFUL_ORDER: SUCCESSFUL_ORDER, moment:moment })   
      // };

      // var mailOptionsCompany2 = {
      //   from: 'info@parcelhero.my',
      //   to: 'zac@waterworthservices.com',
      //   subject: 'Sending Email using Node.js',
      //   html: await ejs.renderFile(__dirname +  "/views/successEmail.ejs", { SUCCESSFUL_ORDER: SUCCESSFUL_ORDER, moment:moment })   

      // };
      /////////////  SET THE RECEIVERS ///////////////
    
      // ACTUALLY SENDIN EMAIL. UNCOMMENT TO ENABLE! ///////////
    transporter.sendMail(mailOptionsCustomer, async function(error, info){
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });

    // transporter.sendMail(mailOptionsCompany, async function(error, info){
    //   if (error) {
    //     console.log(error);
    //   } else {
    //     console.log('Email sent: ' + info.response);
    //   }
    // });
    
    // transporter.sendMail(mailOptionsCompany2, async function(error, info){
    //   if (error) {
    //     console.log(error);
    //   } else {
    //     console.log('Email sent: ' + info.response);
    //   }
    // });
        // ACTUALLY SENDIN EMAIL. UNCOMMENT TO ENABLE! ///////////


    }


    
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

app.post("/registerOrderJerudong", upload.single("pdfInvoice"), async (req,res) =>{
  // app.post("/registerOrder", async (req,res) =>{
    const pdfPath = __dirname+"/"+req.file.path;
    console.log("pdfPath:  " + pdfPath);

    const taxRates = getTaxRates();

    let NEW_ORDER = {
        fullName : JSON.stringify(req.body.inptFullName).replace(/[^a-zA-Z0-9+ ]/g, ""),
        phoneNumber : JSON.stringify(req.body.inptPhoneNumber).replace(/[^a-zA-Z0-9+ ]/g, ""),
        orderWebsite: JSON.stringify(req.body.inptOrderWebsite).replace(/[^a-zA-Z0-9+ ]/g, ""),
        orderNumber: JSON.stringify(req.body.inptOrderNumber).replace(/[^a-zA-Z0-9+ ]/g, ""),
        goodsCatagory: JSON.stringify(req.body.slctGoodsCatagory).replace(/[^a-zA-Z0-9+ ]/g, ""),
        invoiceValueMyr: req.body.inptInvoiceValueMyr,
        shippingAgent: JSON.stringify(req.body.inptShippingAgent).replace(/[^a-zA-Z0-9+ ]/g, ""),
        trackingNumber: JSON.stringify(req.body.inptTrackingNumber).replace(/[^a-zA-Z0-9+ ]/g, ""),
        importTaxRate: taxRates.get(req.body.slctGoodsCatagory),
        exchangeRate: 3.2,  //EXCHANGE RATE HERE
        collectionPoint: "Default",
        serviceFeeBndCents: 0

    }

      //Collect in Brunei
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
            success_url: `${YOUR_DOMAIN}/paymentSuccess?session_id={CHECKOUT_SESSION_ID}&order_id=${JSON_NEW_ORDER}&pdf_path=${pdfPath}`,
            cancel_url: `${YOUR_DOMAIN}/paymentCancelled`,
          });
        //   console.log(res);
        res.redirect(303, session.url);

    

});


app.post("/registerOrderMiri", async (req,res) =>{
  // app.post("/registerOrder", async (req,res) =>{

    const taxRates = getTaxRates();

    let NEW_ORDER = {
        fullName : JSON.stringify(req.body.inptFullName).replace(/[^a-zA-Z0-9+ ]/g, ""),
        phoneNumber : JSON.stringify(req.body.inptPhoneNumber).replace(/[^a-zA-Z0-9+ ]/g, ""),
        orderWebsite: JSON.stringify(req.body.inptOrderWebsite).replace(/[^a-zA-Z0-9+ ]/g, ""),
        orderNumber: JSON.stringify(req.body.inptOrderNumber).replace(/[^a-zA-Z0-9+ ]/g, ""),
        goodsCatagory: JSON.stringify(req.body.slctGoodsCatagory).replace(/[^a-zA-Z0-9+ ]/g, ""),
        invoiceValueMyr: 0,
        shippingAgent: JSON.stringify(req.body.inptShippingAgent).replace(/[^a-zA-Z0-9+ ]/g, ""),
        trackingNumber: JSON.stringify(req.body.inptTrackingNumber).replace(/[^a-zA-Z0-9+ ]/g, ""),
        importTaxRate: taxRates.get(req.body.slctGoodsCatagory),
        exchangeRate: 3.2,  //EXCHANGE RATE HERE
        collectionPoint: "Default",
        serviceFeeBndCents: 0

    }

    //collect in Miri

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
            success_url: `${YOUR_DOMAIN}/paymentSuccess?session_id={CHECKOUT_SESSION_ID}&order_id=${JSON_NEW_ORDER}&pdf_path=${pdfPath}`,
            cancel_url: `${YOUR_DOMAIN}/paymentCancelled`,
          });
        //   console.log(res);
        res.redirect(303, session.url);

});


app.listen(process.env.PORT || 3000, function(){
    console.log("server started on port 3000!");
});



const successEmail = function(SUCCESSFUL_ORDER){
  let htmlText = "<p>This is a test</p>"
  return htmlText;
}


function getTaxRates(){
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

  return taxRates;
}
//


// function getMulterParams(){
//   return {
//     storage: multer.diskStorage({
//         destination: "/upload/images",  // Storage location
//         filename: (req, res, (cb) => {
//             cb(null, Date.now() + path.extname(file.originalname)) // return a unique file name for every file              
//         })
//     }),
  
//     limits: {fileSize: 20000000},   // This limits file size to 2 million bytes(2mb)
  
//     fileFilter: (req, file, cb) => {
//         const validFileTypes = /png/ // Create regex to match jpg and png
  
//         // Do the regex match to check if file extenxion match
//         const extname = validFileTypes.test(path.extname(file.originalname).toLowerCase())
  
//         if(extname === true){
//             // Return true and file is saved
//              return cb(null, true)
//         }else{
//             // Return error message if file extension does not match
//             return cb("Error: Images Only!")
//             }
//         }
//   }
// }

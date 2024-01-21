const nodemailer = require("nodemailer");

const generateOTP = () => {
    let otp = "";
    for (let i = 0; i <= 5; i++) {
        const randVal = Math.round(Math.random() * 9);
        otp = otp + randVal;
    }
    return otp;
}



// Define the mail transporter function
const mailTransport = () => nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
    },
});


function generateEmailTemplate(code) {
    // Define your email template as a string
    const template = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                /* Inline CSS for styling */
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f4;
                    margin: 0;
                    padding: 0;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #ffffff;
                    border-radius: 5px;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                }
                h1 {
                    color: #333;
                }
                p {
                    color: #666;
                }
                .button {
                    display: inline-block;
                    padding: 10px 20px;
                    background-color: #007BFF;
                    color: #fff;
                    text-decoration: none;
                    border-radius: 5px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Verify Your Email</h1>
                <p>We are delighted that you want to join our community of users. Please verify your email to continue.</p>
                <p><strong>Your One-time Password:</strong> <span>${code}</span></p>
                <p>This code is valid for 1 hour.</p>
                <a href="#" class="button">Verify Email</a>
            </div>
        </body>
        </html>
    `;

    return template;
    }




function plainEmailTemplate() {
    // Define your plain email template as a string
    const template = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                /* Inline CSS for styling */
                body {
                    font-family: Arial, sans-serif;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #f4f4f4;
                    border-radius: 5px;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                }
                h1 {
                    color: #333;
                }
                p {
                    color: #666;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <!-- No content inside the email -->
            </div>
        </body>
        </html>
    `;

    return template;
}


function invoiceTemplate(project, tasks) {
  // Extract relevant information from the project and tasks
  const projectName = project.name || 'N/A';
  const totalEstimatedCost = project.totalEstimatedCost || 0;

  // Define your plain email template as a string
  const template = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            /* Inline CSS for styling */
            body {
                font-family: Arial, sans-serif;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
                border-radius: 5px;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            }
            h1 {
                color: #333;
            }
            p {
                color: #666;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Invoice Details</h1>
            <p>Project Name: ${projectName}</p>
            <p>Total Estimated Cost: $${totalEstimatedCost}</p>
            
            <h2>Task Details</h2>
            <ul>
                ${tasks.map((task) => `
                    <li>
                        Task Name: ${task.taskDetails}
                        <p>Task Description: ${task.description || 'No description available'}</p>
                        <p>Costs:</p>
                        <ul>
                            <li>Labor: $${task.costs.labor || 0}</li>
                            <li>Materials: $${task.costs.materials || 0}</li>
                            <li>Other Expenses: $${task.costs.otherExpenses || 0}</li>
                        </ul>
                    </li>
                `).join('')}
            </ul>
        </div>
    </body>
    </html>
  `;

  return template;
}


const sendEmail = async(option) => {
    //CREATE TRANSPORTER
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth:{
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
        },

    })


    //DEFINE EMAIL OPTIONS
    const emailOptions = {
        from: "Way Found support<support@wayfound.com>",
        to: option.email,
        subject: option.subject,
        text: option.message
    }

    await transporter.sendMail(emailOptions)
}


    
    
module.exports = { generateOTP, mailTransport, generateEmailTemplate, plainEmailTemplate, sendEmail, invoiceTemplate };
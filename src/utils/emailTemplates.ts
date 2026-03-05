export function baseTemplate(title: string, body: string) {
    return `
    <div style="font-family:Arial;background:#f4f6f8;padding:40px">
      <div style="max-width:600px;margin:auto;background:white;border-radius:8px;padding:30px">
        <h2 style="color:#111">${title}</h2>
        <div style="color:#444;font-size:15px">
        ${body}
        </div>
        <p style="margin-top:30px;font-size:12px;color:#888">
        ItemBuilder Platform
        </p>
      </div>
    </div>
    `
  }
  
  export function verifyEmailOtpTemplate(code: string) {
    return baseTemplate(
      "Verify Your Email",
      `<p>Your email verification code:</p>
       <h1 style="letter-spacing:6px">${code}</h1>
       <p>This code expires in 10 minutes.</p>`
    )
  }
  
  export function welcomeTemplate(name: string) {
    return baseTemplate(
      "Welcome to ItemBuilder",
      `<p>Hello ${name},</p>
       <p>Your account has been successfully created.</p>`
    )
  }
  
  export function resetPasswordOtpTemplate(code: string) {
    return baseTemplate(
      "Reset Password - OTP",
      `<p>Your password reset code:</p>
       <h1 style="letter-spacing:6px">${code}</h1>
       <p>This code expires in 10 minutes.</p>`
    )
  }
  
  export function passwordChangedTemplate() {
    return baseTemplate(
      "Password Changed",
      `<p>Your password has been successfully updated.</p>`
    )
  }
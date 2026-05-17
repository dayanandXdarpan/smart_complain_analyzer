import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from backend.core.config import settings
import logging

logger = logging.getLogger(__name__)

def send_otp_email(to_email: str, otp: str):
    subject = "Your Complaint Verification OTP"
    body = f"""
    Hello,
    
    Thank you for submitting a complaint. To verify your request and submit it for processing, please enter the following OTP:
    
    {otp}
    
    This OTP will expire in 5 minutes.
    
    Regards,
    Smart Complaint Analyzer
    """
    
    msg = MIMEMultipart()
    msg['From'] = settings.FROM_EMAIL
    msg['To'] = to_email
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'plain'))
    
    try:
        # Use SMTP_SSL for port 465 or starttls for 587
        server = smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT)
        server.starttls()
        server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        logger.info(f"Successfully sent OTP to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")
        return False

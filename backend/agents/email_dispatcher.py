"""
Email Dispatcher
================
Sends context-rich HTML emails to department heads or admins with full
ticket information. Generates unique thread IDs for reply tracking.
"""

import smtplib
import uuid
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, Dict, Any
from backend.core.config import settings

logger = logging.getLogger(__name__)


def _build_html_body(body_text: str, ticket_id: str, thread_id: str) -> str:
    """Wrap plain-text body in a professional HTML email template."""
    # Escape basic HTML entities in the body
    body_html = body_text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    body_html = body_html.replace("\n", "<br>")

    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a2e; margin: 0; padding: 0; background: #f5f5f5; }}
            .container {{ max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }}
            .header {{ background: linear-gradient(135deg, #2d2d5e 0%, #1a1a3a 100%); color: white; padding: 24px 32px; }}
            .header h1 {{ margin: 0; font-size: 18px; font-weight: 600; }}
            .header .ticket-id {{ font-family: monospace; font-size: 13px; opacity: 0.8; margin-top: 4px; }}
            .body {{ padding: 28px 32px; line-height: 1.7; font-size: 14px; }}
            .footer {{ background: #f9f9fb; border-top: 1px solid #eee; padding: 20px 32px; font-size: 12px; color: #666; }}
            .badge {{ display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; }}
            .reply-note {{ background: #f0f4ff; border-left: 3px solid #4f5bd5; padding: 12px 16px; margin-top: 20px; border-radius: 0 8px 8px 0; font-size: 13px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎫 ComplainHUB Notification</h1>
                <div class="ticket-id">Ticket #{ticket_id[:8]}</div>
            </div>
            <div class="body">
                {body_html}
                <div class="reply-note">
                    💬 <strong>Reply to update this ticket.</strong><br>
                    Include status keywords like <code>RESOLVED</code>, <code>IN PROGRESS</code>, or <code>ESCALATED</code> to automatically update the ticket status.
                    <br><br>
                    <small>Thread ID: {thread_id}</small>
                </div>
            </div>
            <div class="footer">
                This is an automated notification from <strong>ComplainHUB</strong>. 
                Do not modify the subject line when replying.
            </div>
        </div>
    </body>
    </html>
    """


def dispatch_ticket_email(
    to_email: str,
    subject: str,
    body: str,
    ticket_id: str,
    smtp_config: Optional[Dict[str, Any]] = None,
) -> str:
    """
    Send a ticket notification email and return a unique thread_id.
    
    Args:
        to_email: Recipient email address
        subject: Email subject (already template-rendered)
        body: Email body text (already template-rendered)
        ticket_id: The ticket ID for reference
        smtp_config: Optional override SMTP config (from email_accounts table)
    
    Returns:
        thread_id: Unique identifier for this email thread
    """
    thread_id = f"CHT-{ticket_id[:8]}-{uuid.uuid4().hex[:6]}"
    
    # Build subject with thread reference
    full_subject = f"[{thread_id}] {subject}"

    # SMTP settings (use override or defaults)
    smtp_server = (smtp_config or {}).get("smtp_server", settings.SMTP_SERVER)
    smtp_port = (smtp_config or {}).get("smtp_port", settings.SMTP_PORT)
    smtp_user = (smtp_config or {}).get("smtp_username", settings.SMTP_USERNAME)
    smtp_pass = (smtp_config or {}).get("smtp_password", settings.SMTP_PASSWORD)
    from_email = (smtp_config or {}).get("email_address", settings.FROM_EMAIL)

    # Build MIME message
    msg = MIMEMultipart("alternative")
    msg["From"] = from_email
    msg["To"] = to_email
    msg["Subject"] = full_subject
    msg["X-ComplainHUB-Thread"] = thread_id
    msg["X-ComplainHUB-Ticket"] = ticket_id

    # Plain text version
    msg.attach(MIMEText(body, "plain"))
    # HTML version
    html_body = _build_html_body(body, ticket_id, thread_id)
    msg.attach(MIMEText(html_body, "html"))

    try:
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.send_message(msg)
        server.quit()
        logger.info(f"✅ Email dispatched to {to_email} | Thread: {thread_id}")
        return thread_id
    except Exception as e:
        logger.error(f"❌ Failed to send email to {to_email}: {e}")
        # Return thread_id anyway for tracking even if email failed
        return thread_id


def send_test_email(smtp_config: Dict[str, Any]) -> bool:
    """Send a test email to verify SMTP credentials."""
    try:
        msg = MIMEMultipart()
        msg["From"] = smtp_config["email_address"]
        msg["To"] = smtp_config["email_address"]
        msg["Subject"] = "✅ ComplainHUB — SMTP Test Successful"
        msg.attach(MIMEText(
            "This is a test email from ComplainHUB to verify your SMTP configuration is working correctly.",
            "plain"
        ))

        server = smtplib.SMTP(smtp_config["smtp_server"], smtp_config["smtp_port"])
        server.starttls()
        server.login(smtp_config["smtp_username"], smtp_config["smtp_password"])
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        logger.error(f"SMTP test failed: {e}")
        return False

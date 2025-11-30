"use server";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // First, ensure we have a "Getting Started" category
    let category = await prisma.kBCategory.findFirst({
      where: { slug: "getting-started" },
    });

    if (!category) {
      category = await prisma.kBCategory.create({
        data: {
          name: "Getting Started",
          slug: "getting-started",
          description: "Learn the basics of using the support portal",
          icon: "🚀",
          sortOrder: 1,
          isPublished: true,
        },
      });
    }

    // Check if article already exists
    const existingArticle = await prisma.kBArticle.findFirst({
      where: { slug: "getting-started-with-support-portal" },
    });

    if (existingArticle) {
      return NextResponse.json({
        success: true,
        message: "Article already exists",
        article: existingArticle,
      });
    }

    // Create the help article
    const article = await prisma.kBArticle.create({
      data: {
        title: "Getting Started with the Support Portal",
        slug: "getting-started-with-support-portal",
        excerpt:
          "Learn how to access the customer portal, create an account, and navigate the dashboard.",
        status: "PUBLISHED",
        sortOrder: 1,
        categoryId: category.id,
        authorId: session.user.id,
        content: `<div class="help-article">
  <h2>Welcome to Our Support Portal</h2>
  <p>Our customer support portal makes it easy to get help, track your requests, and find answers to common questions. This guide will walk you through everything you need to know to get started.</p>

  <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 16px; margin: 20px 0;">
    <strong>💡 Quick Tip:</strong> Bookmark the portal URL for easy access: <code>yoursite.com/portal</code>
  </div>

  <h3>Creating Your Account</h3>
  <p>To use the support portal, you'll need to create an account:</p>

  <ol>
    <li><strong>Visit the portal</strong> - Navigate to the support portal login page</li>
    <li><strong>Click "Create Account"</strong> - Look for the registration link below the login form</li>
    <li><strong>Enter your details</strong> - Provide your email address, name, and create a secure password</li>
    <li><strong>Verify your email</strong> - Check your inbox for a verification email and click the link</li>
    <li><strong>Sign in</strong> - Return to the login page and enter your credentials</li>
  </ol>

  <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px; margin: 20px 0;">
    <strong>⚡ Alternative:</strong> You can also sign in with Google for faster access. Simply click "Sign in with Google" on the login page.
  </div>

  <h3>Your Dashboard</h3>
  <p>After signing in, you'll see your personal dashboard with:</p>

  <ul>
    <li><strong>Welcome Banner</strong> - Shows your name and how many active tickets you have</li>
    <li><strong>Quick Actions</strong> - Shortcuts to create a new ticket, view all tickets, or browse help articles</li>
    <li><strong>Ticket Statistics</strong> - Overview of your Total, Open, Pending, and Resolved tickets</li>
    <li><strong>Recent Tickets</strong> - Your most recently updated support requests</li>
  </ul>

  <h3>Navigation Menu</h3>
  <p>The portal header provides easy access to all areas:</p>

  <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
    <tr style="background: #f9fafb;">
      <th style="padding: 12px; border: 1px solid #e5e7eb; text-align: left;">Menu Item</th>
      <th style="padding: 12px; border: 1px solid #e5e7eb; text-align: left;">Description</th>
    </tr>
    <tr>
      <td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>Dashboard</strong></td>
      <td style="padding: 12px; border: 1px solid #e5e7eb;">Your home page with overview and quick actions</td>
    </tr>
    <tr>
      <td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>My Tickets</strong></td>
      <td style="padding: 12px; border: 1px solid #e5e7eb;">View and manage all your support tickets</td>
    </tr>
    <tr>
      <td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>Knowledge Base</strong></td>
      <td style="padding: 12px; border: 1px solid #e5e7eb;">Browse help articles and FAQs</td>
    </tr>
    <tr>
      <td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>Profile</strong></td>
      <td style="padding: 12px; border: 1px solid #e5e7eb;">Update your account settings and preferences</td>
    </tr>
  </table>

  <h3>What You Can Do</h3>
  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px; margin: 20px 0;">
    <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px;">
      <h4 style="margin-top: 0; color: #1f2937;">📝 Submit Tickets</h4>
      <p style="color: #6b7280; margin-bottom: 0;">Create support requests and get help from our team.</p>
    </div>
    <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px;">
      <h4 style="margin-top: 0; color: #1f2937;">📊 Track Progress</h4>
      <p style="color: #6b7280; margin-bottom: 0;">Monitor the status of all your tickets in one place.</p>
    </div>
    <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px;">
      <h4 style="margin-top: 0; color: #1f2937;">💬 Communicate</h4>
      <p style="color: #6b7280; margin-bottom: 0;">Reply to tickets and attach files easily.</p>
    </div>
    <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px;">
      <h4 style="margin-top: 0; color: #1f2937;">📚 Find Answers</h4>
      <p style="color: #6b7280; margin-bottom: 0;">Browse our knowledge base for instant help.</p>
    </div>
  </div>

  <h3>Need More Help?</h3>
  <p>If you have questions about using the portal, you can:</p>
  <ul>
    <li>Browse our <a href="/portal/help">Knowledge Base</a> for detailed guides</li>
    <li><a href="/portal/tickets/new">Submit a support ticket</a> and our team will assist you</li>
  </ul>

  <div style="background: #ecfdf5; border: 1px solid #6ee7b7; border-radius: 8px; padding: 16px; margin: 20px 0;">
    <strong>✅ You're all set!</strong> Now you know the basics of using our support portal. Start by submitting your first ticket or exploring the knowledge base.
  </div>
</div>`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Help article created successfully",
      article,
      category,
    });
  } catch (error) {
    console.error("Error creating help article:", error);
    return NextResponse.json(
      { error: "Failed to create help article" },
      { status: 500 }
    );
  }
}

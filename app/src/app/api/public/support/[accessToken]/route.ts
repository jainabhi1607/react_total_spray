import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-helpers";
import Client from "@/models/Client";
import ClientSite from "@/models/ClientSite";
import ClientAsset from "@/models/ClientAsset";
import ClientContact from "@/models/ClientContact";
import Title from "@/models/Title";
import SupportTicket from "@/models/SupportTicket";
import SupportTicketDetail from "@/models/SupportTicketDetail";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ accessToken: string }> }
) {
  try {
    await dbConnect();
    const { accessToken } = await params;

    const client = await Client.findOne({ accessToken, status: 1 })
      .select("companyName companyLogo")
      .lean();

    if (!client) {
      return errorResponse("Invalid access token", 404);
    }

    const [sites, assets, contacts, titles] = await Promise.all([
      ClientSite.find({ clientId: client._id, status: 1 })
        .select("siteName")
        .sort({ siteName: 1 })
        .lean(),
      ClientAsset.find({ clientId: client._id, status: 1 })
        .select("machineName serialNo clientSiteId")
        .sort({ machineName: 1 })
        .lean(),
      ClientContact.find({ clientId: client._id })
        .select("name lastName email phone clientSiteId")
        .sort({ name: 1 })
        .lean(),
      Title.find()
        .select("title")
        .sort({ title: 1 })
        .lean(),
    ]);

    return successResponse({
      client,
      sites,
      assets,
      contacts,
      titles,
    });
  } catch (error) {
    console.error("Public support GET error:", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ accessToken: string }> }
) {
  try {
    await dbConnect();
    const { accessToken } = await params;

    const client = await Client.findOne({ accessToken, status: 1 });
    if (!client) {
      return errorResponse("Invalid access token", 404);
    }

    const body = await req.json();
    if (body.action === "createContact") {
      const { name, email, phone, clientSiteId } = body;
      if (!name || !name.trim()) {
        return errorResponse("Name is required");
      }
      const contact = await ClientContact.create({
        clientId: client._id,
        name: name.trim(),
        email: email || undefined,
        phone: phone || undefined,
        clientSiteId: clientSiteId || undefined,
      });
      return successResponse(contact, 201);
    }

    return errorResponse("Invalid action");
  } catch (error) {
    console.error("Public support PUT error:", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ accessToken: string }> }
) {
  try {
    await dbConnect();
    const { accessToken } = await params;

    const client = await Client.findOne({ accessToken, status: 1 });
    if (!client) {
      return errorResponse("Invalid access token", 404);
    }

    const body = await req.json();
    const {
      clientSiteId,
      clientAssetId,
      clientContactId,
      description,
      productionImpact,
      timeIssueOccurred,
    } = body;

    if (!description || !description.trim()) {
      return errorResponse("Description is required");
    }
    if (!clientSiteId) {
      return errorResponse("Site is required");
    }
    if (!clientAssetId) {
      return errorResponse("Asset is required");
    }
    if (!clientContactId) {
      return errorResponse("Requester is required");
    }

    // Validate that site/asset/contact belong to this client
    const [siteValid, assetValid, contactValid] = await Promise.all([
      ClientSite.exists({ _id: clientSiteId, clientId: client._id }),
      ClientAsset.exists({ _id: clientAssetId, clientId: client._id }),
      ClientContact.exists({ _id: clientContactId, clientId: client._id }),
    ]);
    if (!siteValid) return errorResponse("Invalid site");
    if (!assetValid) return errorResponse("Invalid asset");
    if (!contactValid) return errorResponse("Invalid contact");

    // Auto-generate ticket number
    const lastTicket = await SupportTicket.findOne()
      .sort({ ticketNo: -1 })
      .select("ticketNo")
      .lean();
    const ticketNo = lastTicket ? (lastTicket as any).ticketNo + 1 : 10000;

    const supportTicket = await SupportTicket.create({
      ticketNo,
      clientId: client._id,
      clientSiteId,
      clientAssetId,
      clientContactId,
      productionImpact: productionImpact ? Number(productionImpact) : undefined,
      ticketStatus: 1,
      status: 1,
      dateTime: new Date(),
    });

    await SupportTicketDetail.create({
      supportTicketId: supportTicket._id,
      description: description.trim(),
      timeIssueOccurred: timeIssueOccurred || undefined,
    });

    return successResponse(
      { ticketNo: supportTicket.ticketNo, id: supportTicket._id },
      201
    );
  } catch (error) {
    console.error("Public support POST error:", error);
    return errorResponse("Internal server error", 500);
  }
}

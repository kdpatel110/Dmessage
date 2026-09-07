import express from "express";
import User from "../models/user.model.js";
import { verifyWebhook } from "@clerk/backend/webhooks";

const router = express.Router()
router.post("/", async (req, res) => {
    try {
        const signingSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
        if (!signingSecret) {
            res.status(503).json({ message: "Webhook secret is not provided" });
            return;
        }
        // clerk's verifier expects a.Web Request with the raw body: express.raw gives a Buffer.
        const payload = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : String(req.body);
        const request = new Request("http://internal/webhooks/clerk", {
            method: "POST",
            headers: new Headers(req.headers),
            body: payload,
        });

        // throws if the signature is wrong or the body was tampered with; only then do we trust evt.
        const evt = await verifyWebhook(request, { signingSecret });

        if (evt.type === 'user.created' || evt.type === 'user.updated') {
            const userData = evt.data;

            const primaryEmail = userData.email_addresses?.find(
                (email) => email.id === userData.primary_email_address_id
            )?.email_address;

            const fullName = [userData.first_name, userData.last_name].filter(Boolean).join(" ") || userData.username || primaryEmail?.split("@")[0];

            //upsert(update or insert) in MongoDB, if user exist then update otherwise create new user
            await User.findOneAndUpdate(
                { clerkId: userData.id }, //Query
                { clerkId: userData.id, primaryEmail, fullName, profilePic: userData.image_url }, //Update Data
                { new: true, upsert: true, setDefaultsOnInsert: true },
                //new: true: By default, Mongoose returns the document before the update was applied. Setting this to true ensures that the function returns the modified document (or the newly created one) after the operation completes.
            );
        }

        if (evt.type === 'user.deleted') {
            const userData = evt.data;
            //const {id} = evt.data;
            //if (id) await User.findOneAndDelete({ clerkId: id })
            if (userData.id) await User.findOneAndDelete({ clerkId: userData.id })
        }

        res.status(200).json({ received: true });
    } catch (error) {
        console.log("Error in clerk webhook:", error);
        res.status(400).json({message: "webhook verification failed"});
    }

})

export default router











# E-Nyagasambu Tutorial Video Recording Script

Follow this script to record tutorial videos for each flow. Upload each video to YouTube, then update the `embedId` values in `frontend/src/app/(main)/guide/page.tsx`.

---

## Video 1: How to Post a Listing (3-4 min)

### Setup
- Open http://localhost:3000/listings/create on desktop (or phone)
- Have a test phone with MTN MoMo ready
- Screen record ON

### Script

**[0:00-0:15] Intro**
> "Welcome to E-Nyagasambu! In this video, I'll show you how to post a listing on the marketplace. It only takes a few minutes."

**[0:15-0:45] Step 1 — Fill the Form**
> "Start by entering your item title — be specific. For example: iPhone 13 Pro Max, Like New."
> "Add a description, choose the category, and select whether you're selling or renting."
> "Enter the price in Rwandan Francs. You can leave it blank if it's negotiable."
> "Add the location — for example, Kicukiro, Kigali."
> "Upload up to 6 photos. Good photos sell faster!"

**[0:45-1:15] Step 2 — Seller Info**
> "Enter your name and phone number. This must be a valid MTN number."
> "This number is where you'll receive the payment prompt and OTP."

**[1:15-1:45] Step 3 — Choose Duration**
> "Pick how long your listing stays active."
> "3 days for 500 RWF, 7 days for 1,000 RWF, or 30 days for 3,500 RWF."
> "Longer durations give you more visibility."

**[1:45-2:30] Step 4 — Pay with MoMo**
> "Tap Submit. You'll see a waiting screen."
> "Now check your phone — a MoMo USSD popup will appear."
> "Enter your PIN to approve the payment."
> "The system will detect the payment automatically. Don't close the page!"

**[2:30-3:00] Step 5 — OTP Verification**
> "You'll receive a 6-digit code via SMS."
> "Enter it in the app to confirm."
> "If you didn't receive it, tap Resend Code."

**[3:00-3:24] Done!**
> "And that's it! Your listing is now live on the marketplace."
> "Others can now see your item and contact you."
> "Visit e-nyagasambu.com to try it yourself!"

---

## Video 2: How to Get Seller Contact (2-2.5 min)

### Setup
- Open http://localhost:3000/listings on one tab
- Have a specific listing ready to view
- Screen record ON

### Script

**[0:00-0:10] Intro**
> "Want to contact a seller on E-Nyagasambu? Here's how."

**[0:10-0:30] Browse & Open**
> "Browse the marketplace and tap any listing to see its details."
> "You can see photos, price, location, and description."

**[0:30-0:50] Tap Get Contact**
> "To see the seller's phone number, tap 'Get Seller Contact'."
> "This costs 300 RWF — a one-time fee per seller."

**[0:50-1:15] Enter Phone & Pay**
> "Enter your MTN MoMo number."
> "A payment prompt will appear on your phone."
> "Approve it by entering your MoMo PIN."

**[1:15-1:40] OTP Verification**
> "Once payment is confirmed, you'll receive an OTP via SMS."
> "Enter the 6-digit code."

**[1:40-2:15] Contact Revealed!**
> "The seller's phone number is now revealed!"
> "You can tap Call to call directly, or tap WhatsApp to open a chat."
> "This contact is saved — you'll never need to pay again for this seller."

---

## Video 3: MoMo Payment Guide (1.5-2 min)

### Setup
- Start on any payment page (listings/create, coins, or listing detail)
- Have MoMo phone ready
- Screen record ON

### Script

**[0:00-0:15] Intro**
> "All payments on E-Nyagasambu use MTN Mobile Money. Here's how it works."

**[0:15-0:35] The Payment Flow**
> "When you tap Pay, the system sends a USSD request to your phone."
> "You'll see a popup on your phone — NOT in the app."
> "The popup shows the amount and asks for your PIN."

**[0:35-1:00] Approving**
> "Enter your MoMo PIN to approve."
> "The app automatically checks every 5 seconds."
> "Usually takes 5-15 seconds. Stay on the page."

**[1:00-1:25] OTP Step**
> "After payment is confirmed, you receive a 6-digit code via SMS."
> "Enter it to finalize. The code expires in 5 minutes."

**[1:25-1:48] Done**
> "That's it! Same flow for posting, buying coins, or unlocking contacts."
> "Your payment is secure — MTN handles the money, and OTP verifies your identity."

---

## Video 4: How to Buy Coins (1.5 min)

### Setup
- Open http://localhost:3000/coins
- Screen record ON

### Script

**[0:00-0:10] Intro**
> "Coins are how you access premium features on E-Nyagasambu."

**[0:10-0:30] Coin Packages**
> "Go to the Coins page from your dashboard."
> "Choose from 4 packages — the bigger the package, the cheaper per coin."

**[0:30-0:50] Payment**
> "Select a package and enter your MTN MoMo number."
> "Tap Pay with MoMo."
> "Approve the USSD prompt on your phone."

**[0:50-1:10] Coins Credited**
> "Once payment is confirmed, coins are added to your wallet instantly."
> "You can see your balance at the top and view your transaction history below."

**[1:10-1:30] What Coins Do**
> "Use coins to: Post listings for 400 coins, unlock seller contacts for 300 coins, boost your listings for 200 coins, or subscribe to Premium for 1,200 coins per month."
> "Visit e-nyagasambu.com to get started!"

---

## Recording Tips

| Tip | Details |
|-----|---------|
| **Resolution** | Record at 1080p minimum |
| **Frame rate** | 30fps is fine for tutorials |
| **Mouse cursor** | Enable cursor highlighting in your recorder |
| **Speak slowly** | Pause between steps for clarity |
| **Phone recording** | Use a phone screen recorder (built-in on Android/iOS) to show the MoMo popup |
| **Split screen** | Show browser + phone side by side for payment flows |
| **Free tools** | OBS Studio (desktop), built-in screen recorders (Android/iOS) |

## How to Update the Video Embeds

After uploading each video to YouTube, update the `embedId` in:

```
frontend/src/app/(main)/guide/page.tsx
```

Find the `VIDEOS` array and replace the `embedId` values:

```typescript
{
  key: 'post',
  title: 'How to Post a Listing',
  embedId: 'YOUR_YOUTUBE_VIDEO_ID_HERE',  // ← Replace this
  ...
}
```

The YouTube video ID is the part after `watch?v=` in the URL:
`https://www.youtube.com/watch?v=ABC123xyz` → `ABC123xyz`

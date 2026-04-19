# After this PR is merged — one Stripe setting to change

1. Go to https://dashboard.stripe.com/payment-links
2. Click your Premium Payment Link (the one ending in `...4Vy00`)
3. Click the "..." menu → Edit
4. Scroll to "After payment"
5. Choose "Don't show confirmation page" → "Redirect customers to your website"
6. Paste this URL exactly:

   https://pokieanalyzer.com.au/?upgrade=success

7. Click Update / Save

That's it. From now on, customers who pay will return to your app with their Premium features automatically unlocked.

## Test it

**Recommended: Test with Stripe test mode first**

1. In Stripe Dashboard, switch to **Test mode** (toggle in the top-left).
2. Set the "After payment" redirect to `https://pokieanalyzer.com.au/?upgrade=success` (same URL works in test mode).
3. Open https://pokieanalyzer.com.au in an incognito window.
4. Tap a locked feature (Heat Map, Community, etc.) → "🚀 Upgrade to Premium".
5. Pay on Stripe using test card **4242 4242 4242 4242** (any future expiry, any CVC).
6. You'll be redirected back to the app. Locks should be gone, alert should say "Welcome to Premium!".
7. Switch Stripe back to **Live mode** when ready to accept real payments.

**If you test with a real card:** refund yourself in Stripe Dashboard → Payments → click the payment → Refund (full refund).

## If a paying customer is on a different device

They can tap the "Already paid?" link under the Upgrade button to manually unlock.

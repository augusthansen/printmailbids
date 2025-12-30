import { createAdminClient } from '@/lib/supabase/admin';
import { CommissionRates, PlatformSettings } from '@/types/database';

// Default fallback values if database is unavailable
const FALLBACK_BUYER_PREMIUM = 5.0;
const FALLBACK_SELLER_COMMISSION = 8.0;

/**
 * Get platform settings from the database
 * Returns null if settings cannot be fetched
 */
export async function getPlatformSettings(): Promise<PlatformSettings | null> {
  try {
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('platform_settings')
      .select('*')
      .limit(1)
      .single();

    if (error) {
      console.error('Failed to fetch platform settings:', error);
      return null;
    }

    return data as PlatformSettings;
  } catch (error) {
    console.error('Error fetching platform settings:', error);
    return null;
  }
}

/**
 * Get commission rates for a specific seller
 * Checks seller's custom rates first, falls back to platform defaults
 *
 * @param sellerId - The seller's user ID
 * @returns CommissionRates object with buyer premium and seller commission
 */
export async function getCommissionRates(sellerId: string): Promise<CommissionRates> {
  try {
    const adminClient = createAdminClient();

    // Fetch both platform settings and seller profile in parallel
    const [settingsResult, sellerResult] = await Promise.all([
      adminClient
        .from('platform_settings')
        .select('default_buyer_premium_percent, default_seller_commission_percent')
        .limit(1)
        .single(),
      adminClient
        .from('profiles')
        .select('custom_buyer_premium_percent, custom_seller_commission_percent')
        .eq('id', sellerId)
        .single(),
    ]);

    // Get platform defaults
    const defaultBuyerPremium = settingsResult.data?.default_buyer_premium_percent ?? FALLBACK_BUYER_PREMIUM;
    const defaultSellerCommission = settingsResult.data?.default_seller_commission_percent ?? FALLBACK_SELLER_COMMISSION;

    // Check for seller custom rates
    const seller = sellerResult.data;
    const hasCustomRates = !!(seller && (
      seller.custom_buyer_premium_percent !== null ||
      seller.custom_seller_commission_percent !== null
    ));

    return {
      buyer_premium_percent: seller?.custom_buyer_premium_percent ?? defaultBuyerPremium,
      seller_commission_percent: seller?.custom_seller_commission_percent ?? defaultSellerCommission,
      is_custom: hasCustomRates,
    };
  } catch (error) {
    console.error('Error fetching commission rates:', error);
    // Return fallback values on error
    return {
      buyer_premium_percent: FALLBACK_BUYER_PREMIUM,
      seller_commission_percent: FALLBACK_SELLER_COMMISSION,
      is_custom: false,
    };
  }
}

/**
 * Update platform-wide default commission settings
 * Only to be used by admin functions
 */
export async function updatePlatformSettings(settings: {
  default_buyer_premium_percent?: number;
  default_seller_commission_percent?: number;
  auction_extension_minutes?: number;
  offer_expiry_hours?: number;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const adminClient = createAdminClient();

    // Get the existing settings ID
    const { data: existing, error: fetchError } = await adminClient
      .from('platform_settings')
      .select('id')
      .limit(1)
      .single();

    if (fetchError || !existing) {
      return { success: false, error: 'Platform settings not found' };
    }

    const { error: updateError } = await adminClient
      .from('platform_settings')
      .update({
        ...settings,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);

    if (updateError) {
      console.error('Failed to update platform settings:', updateError);
      return { success: false, error: updateError.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating platform settings:', error);
    return { success: false, error: 'Unexpected error updating settings' };
  }
}

/**
 * Update custom commission rates for a specific seller
 * Pass null to remove custom rates and use platform defaults
 */
export async function updateSellerCommissionRates(
  sellerId: string,
  rates: {
    custom_buyer_premium_percent: number | null;
    custom_seller_commission_percent: number | null;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminClient = createAdminClient();

    const { error } = await adminClient
      .from('profiles')
      .update({
        custom_buyer_premium_percent: rates.custom_buyer_premium_percent,
        custom_seller_commission_percent: rates.custom_seller_commission_percent,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sellerId);

    if (error) {
      console.error('Failed to update seller commission rates:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating seller commission rates:', error);
    return { success: false, error: 'Unexpected error updating seller rates' };
  }
}

/**
 * Calculate fee amounts for a transaction
 */
export function calculateFees(
  saleAmount: number,
  rates: CommissionRates
): {
  buyerPremiumAmount: number;
  sellerCommissionAmount: number;
  totalBuyerPays: number;
  sellerPayoutAmount: number;
  platformEarnings: number;
} {
  const buyerPremiumAmount = saleAmount * (rates.buyer_premium_percent / 100);
  const sellerCommissionAmount = saleAmount * (rates.seller_commission_percent / 100);

  return {
    buyerPremiumAmount,
    sellerCommissionAmount,
    totalBuyerPays: saleAmount + buyerPremiumAmount,
    sellerPayoutAmount: saleAmount - sellerCommissionAmount,
    platformEarnings: buyerPremiumAmount + sellerCommissionAmount,
  };
}

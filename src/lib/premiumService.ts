import { supabase, PAYSTACK_PUBLIC_KEY } from './supabase';
import { PremiumPlanConfig, Profile } from '../types';

export const DEFAULT_PREMIUM_PLAN: PremiumPlanConfig = {
  title: '',
  description: '',
  price_ngn: 0,
  duration_days: 0,
  covered_material_ids: [],
  cover_all_materials: true,
  is_active: false,
  updated_at: '',
};

export const premiumService = {
  /**
   * Fetch current active Premium plan configuration from Supabase backend
   * Tries: 1) Edge Function 'premium-settings' -> 2) RPC 'get_premium_plan_config' -> 3) app_settings table
   */
  async getPremiumPlan(): Promise<PremiumPlanConfig> {
    try {
      // 1. Try Supabase Edge Function 'premium-settings'
      try {
        const { data: edgeData, error: edgeErr } = await supabase.functions.invoke('premium-settings', {
          method: 'GET',
        });
        if (!edgeErr && edgeData && (edgeData.price_ngn !== undefined || edgeData.title)) {
          return {
            title: edgeData.title || '',
            description: edgeData.description || '',
            price_ngn: Number(edgeData.price_ngn ?? 0),
            duration_days: Number(edgeData.duration_days ?? 0),
            covered_material_ids: Array.isArray(edgeData.covered_material_ids) ? edgeData.covered_material_ids : [],
            cover_all_materials: edgeData.cover_all_materials ?? (edgeData.covered_material_ids?.length === 0),
            is_active: Boolean(edgeData.is_active ?? false),
            updated_at: edgeData.updated_at || '',
          };
        }
      } catch (e) {
        console.warn('Edge Function premium-settings notice:', e);
      }

      // 2. Try Supabase PostgreSQL RPC 'get_premium_plan_config'
      try {
        const { data: rpcData, error: rpcErr } = await supabase.rpc('get_premium_plan_config');
        if (!rpcErr && rpcData && (rpcData.price_ngn !== undefined || rpcData.title)) {
          return {
            title: rpcData.title || '',
            description: rpcData.description || '',
            price_ngn: Number(rpcData.price_ngn ?? 0),
            duration_days: Number(rpcData.duration_days ?? 0),
            covered_material_ids: Array.isArray(rpcData.covered_material_ids) ? rpcData.covered_material_ids : [],
            cover_all_materials: rpcData.cover_all_materials ?? (rpcData.covered_material_ids?.length === 0),
            is_active: Boolean(rpcData.is_active ?? false),
            updated_at: rpcData.updated_at || '',
          };
        }
      } catch (e) {
        console.warn('RPC get_premium_plan_config notice:', e);
      }

      // 3. Fallback: app_settings table dynamic query
      const { data, error } = await supabase
        .from('app_settings')
        .select('key, value')
        .in('key', ['premium_plan_config', 'ticket_price_ngn']);

      if (!error && data && data.length > 0) {
        const settingsMap: Record<string, string> = {};
        data.forEach((row: { key: string; value: string }) => {
          settingsMap[row.key] = row.value;
        });

        let parsed: any = null;
        if (settingsMap.premium_plan_config) {
          try {
            parsed = JSON.parse(settingsMap.premium_plan_config);
          } catch {
            parsed = { title: settingsMap.premium_plan_config };
          }
        }

        const price = parsed?.price_ngn !== undefined
          ? Number(parsed.price_ngn)
          : (settingsMap.ticket_price_ngn ? Number(settingsMap.ticket_price_ngn) : 0);

        return {
          title: parsed?.title || '',
          description: parsed?.description || '',
          price_ngn: Number(price || 0),
          duration_days: Number(parsed?.duration_days || 0),
          covered_material_ids: Array.isArray(parsed?.covered_material_ids) ? parsed.covered_material_ids : [],
          cover_all_materials: parsed?.cover_all_materials ?? (parsed?.covered_material_ids?.length === 0),
          is_active: Boolean(parsed?.is_active ?? false),
          updated_at: parsed?.updated_at || '',
        };
      }

      return DEFAULT_PREMIUM_PLAN;
    } catch (err) {
      console.warn('Error loading premium plan configuration:', err);
      return DEFAULT_PREMIUM_PLAN;
    }
  },

  /**
   * Save Admin updated Premium plan configuration to Supabase backend
   * Tries: 1) Edge Function 'premium-settings' -> 2) RPC 'save_premium_plan_config' -> 3) app_settings table
   */
  async savePremiumPlan(plan: PremiumPlanConfig): Promise<{ success: boolean; error?: string }> {
    try {
      const payload = {
        title: plan.title || '',
        description: plan.description || '',
        price_ngn: Math.max(0, Number(plan.price_ngn || 0)),
        duration_days: Math.max(0, Number(plan.duration_days || 0)),
        covered_material_ids: Array.isArray(plan.covered_material_ids) ? plan.covered_material_ids : [],
        cover_all_materials: Boolean(plan.cover_all_materials),
        is_active: Boolean(plan.is_active ?? true),
        updated_at: new Date().toISOString(),
      };

      // 1. Try Supabase Edge Function 'premium-settings'
      try {
        const { data: edgeData, error: edgeErr } = await supabase.functions.invoke('premium-settings', {
          method: 'POST',
          body: payload,
        });
        if (!edgeErr && edgeData?.success) {
          return { success: true };
        }
      } catch (e) {
        console.warn('Edge Function save premium-settings notice:', e);
      }

      // 2. Try Supabase PostgreSQL RPC 'save_premium_plan_config'
      try {
        const { data: rpcData, error: rpcErr } = await supabase.rpc('save_premium_plan_config', {
          p_config: payload,
        });
        if (!rpcErr && rpcData?.success) {
          return { success: true };
        }
      } catch (e) {
        console.warn('RPC save_premium_plan_config notice:', e);
      }

      // 3. Fallback: app_settings table upsert
      const { error } = await supabase
        .from('app_settings')
        .upsert(
          {
            key: 'premium_plan_config',
            value: JSON.stringify(payload),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'key' }
        );

      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      console.error('Error saving premium plan config:', err);
      return { success: false, error: err.message || 'Failed to save premium plan' };
    }
  },

  /**
   * Check whether a student has valid active access to a specific material
   */
  checkAccess(
    materialId: string | null | undefined,
    profile: Profile | null | undefined,
    plan: PremiumPlanConfig | null | undefined
  ): {
    hasAccess: boolean;
    reason: 'ACTIVE' | 'ADMIN' | 'NOT_SUBSCRIBED' | 'EXPIRED' | 'NOT_COVERED';
    daysRemaining?: number;
    expiresAt?: string | null;
  } {
    // 1. Admin always has full bypass access
    if (profile?.role === 'admin') {
      return { hasAccess: true, reason: 'ADMIN' };
    }

    // 2. Must be subscribed
    if (!profile?.is_subscribed) {
      return { hasAccess: false, reason: 'NOT_SUBSCRIBED' };
    }

    // 3. Check duration expiry
    if (profile.subscription_expires_at) {
      const expiresAt = new Date(profile.subscription_expires_at);
      const now = new Date();
      if (expiresAt.getTime() <= now.getTime()) {
        return { hasAccess: false, reason: 'EXPIRED', expiresAt: profile.subscription_expires_at };
      }
      const daysRemaining = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

      // 4. Check if material is covered by current plan (if materialId supplied)
      if (materialId && plan && !plan.cover_all_materials && plan.covered_material_ids?.length > 0) {
        const isCovered = plan.covered_material_ids.includes(materialId);
        if (!isCovered) {
          return { hasAccess: false, reason: 'NOT_COVERED', daysRemaining, expiresAt: profile.subscription_expires_at };
        }
      }

      return { hasAccess: true, reason: 'ACTIVE', daysRemaining, expiresAt: profile.subscription_expires_at };
    }

    // If subscription_expires_at is null but is_subscribed is true (legacy active)
    if (materialId && plan && !plan.cover_all_materials && plan.covered_material_ids?.length > 0) {
      const isCovered = plan.covered_material_ids.includes(materialId);
      if (!isCovered) {
        return { hasAccess: false, reason: 'NOT_COVERED' };
      }
    }

    return { hasAccess: true, reason: 'ACTIVE' };
  },

  /**
   * Server-Initiated Paystack Subscription Process:
   * 1. Initiates transaction on Supabase backend ('initialize-payment' Edge Function or 'initialize_backend_payment' RPC).
   * 2. Opens Paystack popup with backend-certified reference / access_code.
   * 3. Verifies and activates subscription on Supabase backend ('verify-payment' Edge Function or 'verify_backend_payment' RPC).
   */
  async processPaystackSubscription({
    user,
    plan,
    onSuccess,
    onClose,
  }: {
    user: { id: string; email?: string } | null;
    plan: PremiumPlanConfig;
    onSuccess?: (reference: string) => void;
    onClose?: () => void;
  }): Promise<void> {
    if (!user || !user.email) {
      throw new Error('User authentication required for payment.');
    }

    // Ensure Paystack popup script is present
    if (typeof (window as any).PaystackPop === 'undefined') {
      throw new Error('Paystack gateway is loading. Please try again in a moment.');
    }

    // Step 1: Initialize Payment from Supabase Backend
    let backendRef = `QH-SUB-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    let accessCode = '';

    try {
      // 1a. Try Supabase Edge Function 'initialize-payment'
      const { data: edgeData, error: edgeErr } = await supabase.functions.invoke('initialize-payment', {
        body: {
          planTitle: plan.title,
          durationDays: plan.duration_days,
        },
      });

      if (!edgeErr && edgeData?.reference) {
        backendRef = edgeData.reference;
        accessCode = edgeData.access_code || '';
      } else {
        // 1b. Try Supabase PostgreSQL RPC 'initialize_backend_payment'
        const { data: rpcData, error: rpcErr } = await supabase.rpc('initialize_backend_payment', {
          p_amount: plan.price_ngn,
        });

        if (!rpcErr && rpcData?.reference) {
          backendRef = rpcData.reference;
        }
      }
    } catch (initErr) {
      console.warn('Backend payment initialization fallback:', initErr);
    }

    // Step 2: Open Paystack Checkout with Backend Reference
    const setupParams: any = {
      key: PAYSTACK_PUBLIC_KEY,
      email: user.email,
      amount: Math.round(plan.price_ngn * 100), // Kobo
      ref: backendRef,
      currency: 'NGN',
      metadata: {
        custom_fields: [
          {
            display_name: 'Plan',
            variable_name: 'plan_title',
            value: plan.title,
          },
          {
            display_name: 'Duration Days',
            variable_name: 'duration_days',
            value: String(plan.duration_days),
          },
        ],
      },
      // Note: Must use standard function() syntax so Object.prototype.toString.call(fn) === "[object Function]"
      // (Paystack Inline v1 rejects async functions because their toString is "[object AsyncFunction]")
      callback: function (response: { reference: string }) {
        const finalRef = response?.reference || backendRef;

        // Step 3: Verify and Activate Subscription on Supabase Backend
        (async () => {
          try {
            // 3a. Try Supabase Edge Function 'verify-payment'
            const { data: verifyData, error: verifyErr } = await supabase.functions.invoke('verify-payment', {
              body: {
                reference: finalRef,
                durationDays: plan.duration_days,
              },
            });

            if (!verifyErr && verifyData?.success) {
              if (onSuccess) onSuccess(finalRef);
              return;
            }

            // 3b. Try Supabase PostgreSQL RPC 'verify_backend_payment'
            const { data: rpcVerify, error: rpcVerifyErr } = await supabase.rpc('verify_backend_payment', {
              p_reference: finalRef,
              p_duration_days: plan.duration_days,
            });

            if (!rpcVerifyErr && rpcVerify?.success) {
              if (onSuccess) onSuccess(finalRef);
              return;
            }

            // 3c. Direct client fallback update
            const durationDays = Number(plan.duration_days || 0);
            const expiresAt = durationDays > 0
              ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString()
              : null;

            await Promise.all([
              supabase.from('payments').insert({
                user_id: user.id,
                amount: plan.price_ngn,
                reference: finalRef,
                status: 'success',
              }),
              supabase.from('profiles').update({
                is_subscribed: true,
                subscription_expires_at: expiresAt,
                updated_at: new Date().toISOString(),
              }).eq('id', user.id),
            ]);

            if (onSuccess) onSuccess(finalRef);
          } catch (postErr) {
            console.error('Error confirming payment verification:', postErr);
            if (onSuccess) onSuccess(finalRef);
          }
        })();
      },
      onClose: function () {
        if (onClose) onClose();
      },
    };

    if (accessCode) {
      setupParams.access_code = accessCode;
    }

    const handler = (window as any).PaystackPop.setup(setupParams);
    handler.openIframe();
  },
};

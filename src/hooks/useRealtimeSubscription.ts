import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePushNotifications } from './usePushNotifications';

type TableName = 'installments' | 'contracts' | 'clients' | 'treasury_transactions';

interface RealtimeConfig {
  tables: TableName[];
  onPaymentReceived?: (payload: Record<string, unknown>) => void;
  onContractCreated?: (payload: Record<string, unknown>) => void;
}

export function useRealtimeSubscription(config: RealtimeConfig = { tables: [] }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { showNotification, preferences } = usePushNotifications();

  useEffect(() => {
    if (!user) return;

    const channels: ReturnType<typeof supabase.channel>[] = [];

    // Subscribe to each table
    config.tables.forEach((table) => {
      const channel = supabase
        .channel(`realtime-${table}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table,
          },
          async (payload) => {
            // Realtime update received

            // Invalidate relevant queries based on table
            switch (table) {
              case 'installments':
                queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
                queryClient.invalidateQueries({ queryKey: ['overdue-clients'] });
                queryClient.invalidateQueries({ queryKey: ['capital-on-street'] });
                queryClient.invalidateQueries({ queryKey: ['installments'] });
                break;

              case 'contracts':
                queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
                queryClient.invalidateQueries({ queryKey: ['contracts'] });
                
                // Notify on new contract
                if (payload.eventType === 'INSERT' && preferences.enabled) {
                  const contract = payload.new as Record<string, unknown>;
                  const amount = typeof contract.total_amount === 'number' ? contract.total_amount : 0;
                  showNotification('📄 Novo Contrato Criado', {
                    body: `Contrato de R$ ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} criado`,
                    tag: 'new-contract',
                    soundType: 'success',
                  });
                  config.onContractCreated?.(payload.new);
                }
                break;

              case 'clients':
                queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
                queryClient.invalidateQueries({ queryKey: ['clients'] });
                break;

              case 'treasury_transactions':
                queryClient.invalidateQueries({ queryKey: ['treasury'] });
                queryClient.invalidateQueries({ queryKey: ['treasury-summary'] });
                queryClient.invalidateQueries({ queryKey: ['recent-payments'] });
                
                // Notify on payment received
                if (payload.eventType === 'INSERT' && preferences.enabled && preferences.payments) {
                  const transaction = payload.new as Record<string, unknown>;
                  if (String(transaction.category) === 'Recebimento' || String(transaction.type) === 'entrada') {
                    const txAmount = typeof transaction.amount === 'number' ? transaction.amount : 0;
                    showNotification('💰 Pagamento Recebido!', {
                      body: `R$ ${txAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} - ${String(transaction.description || '')}`,
                      tag: 'payment-received',
                      soundType: 'success',
                    });
                    config.onPaymentReceived?.(payload.new);
                  }
                }
                break;
            }
          }
        )
        .subscribe();

      channels.push(channel);
    });

    // Cleanup subscriptions
    return () => {
      channels.forEach((channel) => {
        supabase.removeChannel(channel);
      });
    };
  }, [user, queryClient, config.tables.join(','), preferences.enabled, preferences.payments]);
}

// Hook specifically for dashboard realtime updates
export function useDashboardRealtime() {
  useRealtimeSubscription({
    tables: ['installments', 'contracts', 'clients', 'treasury_transactions'],
  });
}

// Hook specifically for treasury realtime updates
export function useTreasuryRealtime() {
  useRealtimeSubscription({
    tables: ['treasury_transactions', 'installments'],
  });
}

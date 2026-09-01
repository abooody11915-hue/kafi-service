export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_events: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: number
          metadata: Json
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: never
          metadata?: Json
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: never
          metadata?: Json
        }
        Relationships: []
      }
      customer_addresses: {
        Row: {
          building_no: string | null
          city: string
          created_at: string
          customer_id: string
          district: string
          id: string
          label: string | null
          latitude: number | null
          longitude: number | null
          street: string | null
          unit_no: string | null
        }
        Insert: {
          building_no?: string | null
          city: string
          created_at?: string
          customer_id: string
          district: string
          id?: string
          label?: string | null
          latitude?: number | null
          longitude?: number | null
          street?: string | null
          unit_no?: string | null
        }
        Update: {
          building_no?: string | null
          city?: string
          created_at?: string
          customer_id?: string
          district?: string
          id?: string
          label?: string | null
          latitude?: number | null
          longitude?: number | null
          street?: string | null
          unit_no?: string | null
        }
        Relationships: []
      }
      customer_invoices: {
        Row: {
          created_at: string
          currency: string
          id: string
          invoice_number: number
          issued_at: string | null
          request_id: string
          status: string
          subtotal_minor: number
          tax_minor: number
          total_minor: number | null
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: string
          invoice_number?: never
          issued_at?: string | null
          request_id: string
          status: string
          subtotal_minor: number
          tax_minor: number
          total_minor?: number | null
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          invoice_number?: never
          issued_at?: string | null
          request_id?: string
          status?: string
          subtotal_minor?: number
          tax_minor?: number
          total_minor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_invoices_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: true
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger_accounts: {
        Row: {
          code: string
          created_at: string
          currency: string
          id: string
          owner_id: string | null
          owner_type: string
        }
        Insert: {
          code: string
          created_at?: string
          currency?: string
          id?: string
          owner_id?: string | null
          owner_type: string
        }
        Update: {
          code?: string
          created_at?: string
          currency?: string
          id?: string
          owner_id?: string | null
          owner_type?: string
        }
        Relationships: []
      }
      ledger_entries: {
        Row: {
          account_id: string
          amount_minor: number
          created_at: string
          direction: string
          id: number
          transaction_id: string
        }
        Insert: {
          account_id: string
          amount_minor: number
          created_at?: string
          direction: string
          id?: never
          transaction_id: string
        }
        Update: {
          account_id?: string
          amount_minor?: number
          created_at?: string
          direction?: string
          id?: never
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ledger_entries_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ledger_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "ledger_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger_transactions: {
        Row: {
          created_at: string
          description: string
          id: string
          posted_at: string
          reference_id: string
          reference_type: string
          reversed_by: string | null
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          posted_at?: string
          reference_id: string
          reference_type: string
          reversed_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          posted_at?: string
          reference_id?: string
          reference_type?: string
          reversed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ledger_transactions_reversed_by_fkey"
            columns: ["reversed_by"]
            isOneToOne: false
            referencedRelation: "ledger_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_providers: {
        Row: {
          account_holder: string | null
          avatar_url: string | null
          bank_name: string | null
          business_kind: Database["public"]["Enums"]["provider_business_type"]
          category: Database["public"]["Enums"]["maintenance_category"]
          created_at: string
          debt_limit: number | null
          estimated_price: number
          iban: string | null
          id: string
          is_active: boolean
          lat: number | null
          lng: number | null
          name: string
          phone: string | null
          rating: number | null
          rating_count: number
          response_time: string
          service_radius_km: number
          spoken_languages: string[]
          updated_at: string
          user_id: string
          vat_registration_number: string | null
          verification_notes: string | null
          verification_status: Database["public"]["Enums"]["provider_verification_status"]
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          account_holder?: string | null
          avatar_url?: string | null
          bank_name?: string | null
          business_kind?: Database["public"]["Enums"]["provider_business_type"]
          category?: Database["public"]["Enums"]["maintenance_category"]
          created_at?: string
          debt_limit?: number | null
          estimated_price?: number
          iban?: string | null
          id?: string
          is_active?: boolean
          lat?: number | null
          lng?: number | null
          name: string
          phone?: string | null
          rating?: number | null
          rating_count?: number
          response_time?: string
          service_radius_km?: number
          spoken_languages?: string[]
          updated_at?: string
          user_id: string
          vat_registration_number?: string | null
          verification_notes?: string | null
          verification_status?: Database["public"]["Enums"]["provider_verification_status"]
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          account_holder?: string | null
          avatar_url?: string | null
          bank_name?: string | null
          business_kind?: Database["public"]["Enums"]["provider_business_type"]
          category?: Database["public"]["Enums"]["maintenance_category"]
          created_at?: string
          debt_limit?: number | null
          estimated_price?: number
          iban?: string | null
          id?: string
          is_active?: boolean
          lat?: number | null
          lng?: number | null
          name?: string
          phone?: string | null
          rating?: number | null
          rating_count?: number
          response_time?: string
          service_radius_km?: number
          spoken_languages?: string[]
          updated_at?: string
          user_id?: string
          vat_registration_number?: string | null
          verification_notes?: string | null
          verification_status?: Database["public"]["Enums"]["provider_verification_status"]
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      maintenance_request_events: {
        Row: {
          actor_id: string | null
          created_at: string
          event_type: string
          from_status: Database["public"]["Enums"]["maintenance_status"] | null
          id: number
          idempotency_key: string
          payload: Json
          request_id: string
          to_status: Database["public"]["Enums"]["maintenance_status"] | null
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          event_type: string
          from_status?: Database["public"]["Enums"]["maintenance_status"] | null
          id?: never
          idempotency_key: string
          payload?: Json
          request_id: string
          to_status?: Database["public"]["Enums"]["maintenance_status"] | null
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          event_type?: string
          from_status?: Database["public"]["Enums"]["maintenance_status"] | null
          id?: never
          idempotency_key?: string
          payload?: Json
          request_id?: string
          to_status?: Database["public"]["Enums"]["maintenance_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_request_events_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "maintenance_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_request_media: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          media_kind: string
          mime_type: string | null
          request_id: string
          size_bytes: number | null
          storage_path: string
          uploaded_by: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          media_kind: string
          mime_type?: string | null
          request_id: string
          size_bytes?: number | null
          storage_path: string
          uploaded_by: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          media_kind?: string
          mime_type?: string | null
          request_id?: string
          size_bytes?: number | null
          storage_path?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_request_media_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "maintenance_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_requests: {
        Row: {
          after_service_policy: string
          ai_generated: boolean
          ai_price_max: number | null
          ai_price_min: number | null
          ai_suggestions: Json
          ai_summary: string | null
          apartment_number: string | null
          appointment_status: string
          arrived_at: string | null
          building_id: string | null
          category: Database["public"]["Enums"]["maintenance_category"]
          completion_rework_count: number
          contact_phone: string | null
          created_at: string
          customer_address_id: string
          description: string | null
          en_route_at: string | null
          expired_at: string | null
          floor: string | null
          id: string
          idempotency_key: string
          last_activity_at: string
          location_note: string | null
          manager_notes: string | null
          offered_price: number | null
          original_completed_at: string | null
          partner_external_ref: string | null
          partner_id: string | null
          pricing_mode: Database["public"]["Enums"]["maintenance_pricing_mode"]
          priority: Database["public"]["Enums"]["maintenance_request_priority"]
          provider_id: string | null
          rating: number | null
          rating_comment: string | null
          ref_no: number
          repost_count: number
          request_lat: number | null
          request_lng: number | null
          scheduled_date: string | null
          scheduled_time: string | null
          service_code: string
          service_metadata: Json
          service_timing_mode: string
          source: string
          status: Database["public"]["Enums"]["maintenance_status"]
          tenant_id: string | null
          title: string
          type: Database["public"]["Enums"]["maintenance_type"]
          updated_at: string
          user_id: string
          warranty_count: number
          warranty_opened_at: string | null
          warranty_reason: string | null
          warranty_rejected_at: string | null
          warranty_rejection_reason: string | null
          warranty_resolved_at: string | null
          work_completed_at: string | null
          work_started_at: string | null
          workflow_type: string
        }
        Insert: {
          after_service_policy: string
          ai_generated?: boolean
          ai_price_max?: number | null
          ai_price_min?: number | null
          ai_suggestions?: Json
          ai_summary?: string | null
          apartment_number?: string | null
          appointment_status?: string
          arrived_at?: string | null
          building_id?: string | null
          category?: Database["public"]["Enums"]["maintenance_category"]
          completion_rework_count?: number
          contact_phone?: string | null
          created_at?: string
          customer_address_id: string
          description?: string | null
          en_route_at?: string | null
          expired_at?: string | null
          floor?: string | null
          id?: string
          idempotency_key: string
          last_activity_at?: string
          location_note?: string | null
          manager_notes?: string | null
          offered_price?: number | null
          original_completed_at?: string | null
          partner_external_ref?: string | null
          partner_id?: string | null
          pricing_mode?: Database["public"]["Enums"]["maintenance_pricing_mode"]
          priority?: Database["public"]["Enums"]["maintenance_request_priority"]
          provider_id?: string | null
          rating?: number | null
          rating_comment?: string | null
          ref_no?: never
          repost_count?: number
          request_lat?: number | null
          request_lng?: number | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          service_code: string
          service_metadata?: Json
          service_timing_mode?: string
          source?: string
          status?: Database["public"]["Enums"]["maintenance_status"]
          tenant_id?: string | null
          title: string
          type?: Database["public"]["Enums"]["maintenance_type"]
          updated_at?: string
          user_id: string
          warranty_count?: number
          warranty_opened_at?: string | null
          warranty_reason?: string | null
          warranty_rejected_at?: string | null
          warranty_rejection_reason?: string | null
          warranty_resolved_at?: string | null
          work_completed_at?: string | null
          work_started_at?: string | null
          workflow_type: string
        }
        Update: {
          after_service_policy?: string
          ai_generated?: boolean
          ai_price_max?: number | null
          ai_price_min?: number | null
          ai_suggestions?: Json
          ai_summary?: string | null
          apartment_number?: string | null
          appointment_status?: string
          arrived_at?: string | null
          building_id?: string | null
          category?: Database["public"]["Enums"]["maintenance_category"]
          completion_rework_count?: number
          contact_phone?: string | null
          created_at?: string
          customer_address_id?: string
          description?: string | null
          en_route_at?: string | null
          expired_at?: string | null
          floor?: string | null
          id?: string
          idempotency_key?: string
          last_activity_at?: string
          location_note?: string | null
          manager_notes?: string | null
          offered_price?: number | null
          original_completed_at?: string | null
          partner_external_ref?: string | null
          partner_id?: string | null
          pricing_mode?: Database["public"]["Enums"]["maintenance_pricing_mode"]
          priority?: Database["public"]["Enums"]["maintenance_request_priority"]
          provider_id?: string | null
          rating?: number | null
          rating_comment?: string | null
          ref_no?: never
          repost_count?: number
          request_lat?: number | null
          request_lng?: number | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          service_code?: string
          service_metadata?: Json
          service_timing_mode?: string
          source?: string
          status?: Database["public"]["Enums"]["maintenance_status"]
          tenant_id?: string | null
          title?: string
          type?: Database["public"]["Enums"]["maintenance_type"]
          updated_at?: string
          user_id?: string
          warranty_count?: number
          warranty_opened_at?: string | null
          warranty_reason?: string | null
          warranty_rejected_at?: string | null
          warranty_rejection_reason?: string | null
          warranty_resolved_at?: string | null
          work_completed_at?: string | null
          work_started_at?: string | null
          workflow_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_requests_customer_address_id_fkey"
            columns: ["customer_address_id"]
            isOneToOne: false
            referencedRelation: "customer_addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "maintenance_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_service_code_fkey"
            columns: ["service_code"]
            isOneToOne: false
            referencedRelation: "service_catalog"
            referencedColumns: ["code"]
          },
        ]
      }
      partner_customer_links: {
        Row: {
          consented_at: string
          created_at: string
          customer_id: string
          external_customer_ref: string
          external_property_ref: string | null
          id: string
          partner_id: string
          revoked_at: string | null
        }
        Insert: {
          consented_at: string
          created_at?: string
          customer_id: string
          external_customer_ref: string
          external_property_ref?: string | null
          id?: string
          partner_id: string
          revoked_at?: string | null
        }
        Update: {
          consented_at?: string
          created_at?: string
          customer_id?: string
          external_customer_ref?: string
          external_property_ref?: string | null
          id?: string
          partner_id?: string
          revoked_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_customer_links_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_memberships: {
        Row: {
          created_at: string
          is_active: boolean
          partner_id: string
          role: Database["public"]["Enums"]["partner_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          is_active?: boolean
          partner_id: string
          role?: Database["public"]["Enums"]["partner_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          is_active?: boolean
          partner_id?: string
          role?: Database["public"]["Enums"]["partner_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_memberships_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          code: string
          created_at: string
          id: string
          name_ar: string
          name_en: string | null
          status: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          name_ar: string
          name_en?: string | null
          status?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name_ar?: string
          name_en?: string | null
          status?: string
        }
        Relationships: []
      }
      platform_memberships: {
        Row: {
          created_at: string
          is_active: boolean
          role: Database["public"]["Enums"]["platform_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          is_active?: boolean
          role: Database["public"]["Enums"]["platform_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["platform_role"]
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          locale: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          locale?: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          locale?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      provider_documents: {
        Row: {
          created_at: string
          doc_type: Database["public"]["Enums"]["provider_document_type"]
          id: string
          provider_user_id: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["provider_document_status"]
          storage_path: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          doc_type: Database["public"]["Enums"]["provider_document_type"]
          id?: string
          provider_user_id: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["provider_document_status"]
          storage_path: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          doc_type?: Database["public"]["Enums"]["provider_document_type"]
          id?: string
          provider_user_id?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["provider_document_status"]
          storage_path?: string
          updated_at?: string
        }
        Relationships: []
      }
      provider_invoices: {
        Row: {
          amount: number
          base_amount: number
          completion_proof_storage_path: string | null
          created_at: string
          description: string | null
          dispute_reason: string | null
          disputed_at: string | null
          id: string
          payment_confirmed: boolean
          payment_method: string | null
          platform_fee_amount: number
          platform_fee_percent: number
          provider_amount: number
          provider_confirmed_at: string | null
          provider_id: string
          provider_received: boolean
          provider_user_id: string
          receipt_storage_path: string | null
          ref_no: number
          request_id: string
          settlement_direction: string
          status: Database["public"]["Enums"]["provider_invoice_status"]
          updated_at: string
          user_id: string
          user_paid_at: string | null
          vat_amount: number
          vat_percent: number
        }
        Insert: {
          amount: number
          base_amount: number
          completion_proof_storage_path?: string | null
          created_at?: string
          description?: string | null
          dispute_reason?: string | null
          disputed_at?: string | null
          id?: string
          payment_confirmed?: boolean
          payment_method?: string | null
          platform_fee_amount?: number
          platform_fee_percent?: number
          provider_amount?: number
          provider_confirmed_at?: string | null
          provider_id: string
          provider_received?: boolean
          provider_user_id: string
          receipt_storage_path?: string | null
          ref_no?: never
          request_id: string
          settlement_direction?: string
          status?: Database["public"]["Enums"]["provider_invoice_status"]
          updated_at?: string
          user_id: string
          user_paid_at?: string | null
          vat_amount?: number
          vat_percent?: number
        }
        Update: {
          amount?: number
          base_amount?: number
          completion_proof_storage_path?: string | null
          created_at?: string
          description?: string | null
          dispute_reason?: string | null
          disputed_at?: string | null
          id?: string
          payment_confirmed?: boolean
          payment_method?: string | null
          platform_fee_amount?: number
          platform_fee_percent?: number
          provider_amount?: number
          provider_confirmed_at?: string | null
          provider_id?: string
          provider_received?: boolean
          provider_user_id?: string
          receipt_storage_path?: string | null
          ref_no?: never
          request_id?: string
          settlement_direction?: string
          status?: Database["public"]["Enums"]["provider_invoice_status"]
          updated_at?: string
          user_id?: string
          user_paid_at?: string | null
          vat_amount?: number
          vat_percent?: number
        }
        Relationships: [
          {
            foreignKeyName: "provider_invoices_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "maintenance_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_invoices_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: true
            referencedRelation: "maintenance_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_memberships: {
        Row: {
          created_at: string
          is_active: boolean
          provider_id: string
          role: Database["public"]["Enums"]["provider_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          is_active?: boolean
          provider_id: string
          role: Database["public"]["Enums"]["provider_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          is_active?: boolean
          provider_id?: string
          role?: Database["public"]["Enums"]["provider_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_memberships_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "provider_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_offers: {
        Row: {
          created_at: string
          distance_km: number | null
          expires_at: string | null
          id: string
          notes: string | null
          offered_price: number | null
          provider_id: string
          provider_user_id: string
          quoted_at: string | null
          request_id: string
          responded_at: string | null
          status: Database["public"]["Enums"]["provider_offer_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          distance_km?: number | null
          expires_at?: string | null
          id?: string
          notes?: string | null
          offered_price?: number | null
          provider_id: string
          provider_user_id: string
          quoted_at?: string | null
          request_id: string
          responded_at?: string | null
          status?: Database["public"]["Enums"]["provider_offer_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          distance_km?: number | null
          expires_at?: string | null
          id?: string
          notes?: string | null
          offered_price?: number | null
          provider_id?: string
          provider_user_id?: string
          quoted_at?: string | null
          request_id?: string
          responded_at?: string | null
          status?: Database["public"]["Enums"]["provider_offer_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_offers_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "maintenance_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_offers_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "maintenance_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_organizations: {
        Row: {
          commercial_registration_no: string | null
          created_at: string
          display_name: string
          id: string
          legal_name: string
          organization_kind: string
          status: Database["public"]["Enums"]["verification_status"]
          updated_at: string
        }
        Insert: {
          commercial_registration_no?: string | null
          created_at?: string
          display_name: string
          id?: string
          legal_name: string
          organization_kind: string
          status?: Database["public"]["Enums"]["verification_status"]
          updated_at?: string
        }
        Update: {
          commercial_registration_no?: string | null
          created_at?: string
          display_name?: string
          id?: string
          legal_name?: string
          organization_kind?: string
          status?: Database["public"]["Enums"]["verification_status"]
          updated_at?: string
        }
        Relationships: []
      }
      provider_service_catalog: {
        Row: {
          created_at: string
          is_active: boolean
          provider_id: string
          service_code: string
        }
        Insert: {
          created_at?: string
          is_active?: boolean
          provider_id: string
          service_code: string
        }
        Update: {
          created_at?: string
          is_active?: boolean
          provider_id?: string
          service_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_service_catalog_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "maintenance_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_service_catalog_service_code_fkey"
            columns: ["service_code"]
            isOneToOne: false
            referencedRelation: "service_catalog"
            referencedColumns: ["code"]
          },
        ]
      }
      provider_settlements: {
        Row: {
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          id: string
          initiator: Database["public"]["Enums"]["provider_settlement_initiator"]
          notes: string | null
          owner_notes: string | null
          period_from: string | null
          period_to: string | null
          provider_id: string
          provider_user_id: string
          receipt_storage_path: string | null
          ref_no: number
          settlement_direction: string
          status: Database["public"]["Enums"]["provider_settlement_status"]
          submitted_at: string | null
          total_amount: number
          transactions_count: number
          updated_at: string
        }
        Insert: {
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          id?: string
          initiator?: Database["public"]["Enums"]["provider_settlement_initiator"]
          notes?: string | null
          owner_notes?: string | null
          period_from?: string | null
          period_to?: string | null
          provider_id: string
          provider_user_id: string
          receipt_storage_path?: string | null
          ref_no?: never
          settlement_direction?: string
          status?: Database["public"]["Enums"]["provider_settlement_status"]
          submitted_at?: string | null
          total_amount?: number
          transactions_count?: number
          updated_at?: string
        }
        Update: {
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          id?: string
          initiator?: Database["public"]["Enums"]["provider_settlement_initiator"]
          notes?: string | null
          owner_notes?: string | null
          period_from?: string | null
          period_to?: string | null
          provider_id?: string
          provider_user_id?: string
          receipt_storage_path?: string | null
          ref_no?: never
          settlement_direction?: string
          status?: Database["public"]["Enums"]["provider_settlement_status"]
          submitted_at?: string | null
          total_amount?: number
          transactions_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_settlements_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "maintenance_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_transactions: {
        Row: {
          created_at: string
          id: string
          invoice_id: string
          paid_at: string | null
          platform_fee: number
          platform_fee_percent: number
          provider_amount: number
          provider_id: string
          provider_user_id: string
          request_id: string
          settlement_direction: string
          settlement_id: string | null
          status: Database["public"]["Enums"]["provider_transaction_status"]
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          invoice_id: string
          paid_at?: string | null
          platform_fee: number
          platform_fee_percent: number
          provider_amount: number
          provider_id: string
          provider_user_id: string
          request_id: string
          settlement_direction?: string
          settlement_id?: string | null
          status?: Database["public"]["Enums"]["provider_transaction_status"]
          total_amount: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          invoice_id?: string
          paid_at?: string | null
          platform_fee?: number
          platform_fee_percent?: number
          provider_amount?: number
          provider_id?: string
          provider_user_id?: string
          request_id?: string
          settlement_direction?: string
          settlement_id?: string | null
          status?: Database["public"]["Enums"]["provider_transaction_status"]
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_transactions_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: true
            referencedRelation: "provider_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_transactions_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "maintenance_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_transactions_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: true
            referencedRelation: "maintenance_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_transactions_settlement_fk"
            columns: ["settlement_id"]
            isOneToOne: false
            referencedRelation: "provider_settlements"
            referencedColumns: ["id"]
          },
        ]
      }
      service_assignments: {
        Row: {
          accepted_at: string | null
          assigned_by: string
          created_at: string
          ended_at: string | null
          id: string
          provider_id: string
          request_id: string
          technician_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          assigned_by: string
          created_at?: string
          ended_at?: string | null
          id?: string
          provider_id: string
          request_id: string
          technician_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          assigned_by?: string
          created_at?: string
          ended_at?: string | null
          id?: string
          provider_id?: string
          request_id?: string
          technician_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_assignments_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "provider_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_assignments_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      service_catalog: {
        Row: {
          after_service_policy: string
          code: string
          config: Json
          created_at: string
          created_by: string | null
          customer_visible: boolean
          description_ar: string | null
          family_code: string
          id: string
          is_active: boolean
          legacy_category: Database["public"]["Enums"]["maintenance_category"]
          name_ar: string
          provider_selectable: boolean
          sort_order: number
          supports_fixed_price: boolean
          supports_offers: boolean
          updated_at: string
          workflow_type: string
        }
        Insert: {
          after_service_policy?: string
          code: string
          config?: Json
          created_at?: string
          created_by?: string | null
          customer_visible?: boolean
          description_ar?: string | null
          family_code: string
          id?: string
          is_active?: boolean
          legacy_category: Database["public"]["Enums"]["maintenance_category"]
          name_ar: string
          provider_selectable?: boolean
          sort_order?: number
          supports_fixed_price?: boolean
          supports_offers?: boolean
          updated_at?: string
          workflow_type?: string
        }
        Update: {
          after_service_policy?: string
          code?: string
          config?: Json
          created_at?: string
          created_by?: string | null
          customer_visible?: boolean
          description_ar?: string | null
          family_code?: string
          id?: string
          is_active?: boolean
          legacy_category?: Database["public"]["Enums"]["maintenance_category"]
          name_ar?: string
          provider_selectable?: boolean
          sort_order?: number
          supports_fixed_price?: boolean
          supports_offers?: boolean
          updated_at?: string
          workflow_type?: string
        }
        Relationships: []
      }
      service_catalog_items: {
        Row: {
          code: string
          created_at: string
          description_ar: string | null
          family_id: string
          id: string
          is_active: boolean
          name_ar: string
          name_en: string | null
          requires_quote: boolean
        }
        Insert: {
          code: string
          created_at?: string
          description_ar?: string | null
          family_id: string
          id?: string
          is_active?: boolean
          name_ar: string
          name_en?: string | null
          requires_quote?: boolean
        }
        Update: {
          code?: string
          created_at?: string
          description_ar?: string | null
          family_id?: string
          id?: string
          is_active?: boolean
          name_ar?: string
          name_en?: string | null
          requires_quote?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "service_catalog_items_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "service_families"
            referencedColumns: ["id"]
          },
        ]
      }
      service_catalog_versions: {
        Row: {
          base_price_minor: number | null
          currency: string
          effective_from: string
          effective_to: string | null
          id: string
          service_id: string
          version: number
          warranty_days: number
        }
        Insert: {
          base_price_minor?: number | null
          currency?: string
          effective_from: string
          effective_to?: string | null
          id?: string
          service_id: string
          version: number
          warranty_days?: number
        }
        Update: {
          base_price_minor?: number | null
          currency?: string
          effective_from?: string
          effective_to?: string | null
          id?: string
          service_id?: string
          version?: number
          warranty_days?: number
        }
        Relationships: [
          {
            foreignKeyName: "service_catalog_versions_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "service_catalog_items"
            referencedColumns: ["id"]
          },
        ]
      }
      service_families: {
        Row: {
          code: string
          id: string
          is_active: boolean
          name_ar: string
          name_en: string | null
          sort_order: number
        }
        Insert: {
          code: string
          id?: string
          is_active?: boolean
          name_ar: string
          name_en?: string | null
          sort_order?: number
        }
        Update: {
          code?: string
          id?: string
          is_active?: boolean
          name_ar?: string
          name_en?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      service_request_events: {
        Row: {
          actor_id: string | null
          created_at: string
          event_type: string
          from_status: Database["public"]["Enums"]["request_status"] | null
          id: number
          idempotency_key: string
          payload: Json
          request_id: string
          to_status: Database["public"]["Enums"]["request_status"] | null
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          event_type: string
          from_status?: Database["public"]["Enums"]["request_status"] | null
          id?: never
          idempotency_key: string
          payload?: Json
          request_id: string
          to_status?: Database["public"]["Enums"]["request_status"] | null
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          event_type?: string
          from_status?: Database["public"]["Enums"]["request_status"] | null
          id?: never
          idempotency_key?: string
          payload?: Json
          request_id?: string
          to_status?: Database["public"]["Enums"]["request_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "service_request_events_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      service_requests: {
        Row: {
          address_id: string
          completed_at: string | null
          created_at: string
          customer_id: string
          description: string
          id: string
          idempotency_key: string
          partner_external_ref: string | null
          partner_id: string | null
          request_number: number
          service_id: string
          status: Database["public"]["Enums"]["request_status"]
          submitted_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          address_id: string
          completed_at?: string | null
          created_at?: string
          customer_id: string
          description: string
          id?: string
          idempotency_key: string
          partner_external_ref?: string | null
          partner_id?: string | null
          request_number?: never
          service_id: string
          status?: Database["public"]["Enums"]["request_status"]
          submitted_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          address_id?: string
          completed_at?: string | null
          created_at?: string
          customer_id?: string
          description?: string
          id?: string
          idempotency_key?: string
          partner_external_ref?: string | null
          partner_id?: string | null
          request_number?: never
          service_id?: string
          status?: Database["public"]["Enums"]["request_status"]
          submitted_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_requests_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "customer_addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "service_catalog_items"
            referencedColumns: ["id"]
          },
        ]
      }
      settlement_batches: {
        Row: {
          approved_by: string | null
          created_at: string
          created_by: string
          currency: string
          id: string
          provider_id: string
          status: string
          total_minor: number
        }
        Insert: {
          approved_by?: string | null
          created_at?: string
          created_by: string
          currency?: string
          id?: string
          provider_id: string
          status?: string
          total_minor?: number
        }
        Update: {
          approved_by?: string | null
          created_at?: string
          created_by?: string
          currency?: string
          id?: string
          provider_id?: string
          status?: string
          total_minor?: number
        }
        Relationships: [
          {
            foreignKeyName: "settlement_batches_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "provider_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      settlement_items: {
        Row: {
          amount_minor: number
          batch_id: string
          ledger_entry_id: number
        }
        Insert: {
          amount_minor: number
          batch_id: string
          ledger_entry_id: number
        }
        Update: {
          amount_minor?: number
          batch_id?: string
          ledger_entry_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "settlement_items_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "settlement_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlement_items_ledger_entry_id_fkey"
            columns: ["ledger_entry_id"]
            isOneToOne: true
            referencedRelation: "ledger_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      settlement_state_transitions: {
        Row: {
          actor_user_id: string | null
          created_at: string
          from_state: string | null
          id: string
          meta: Json
          reason: string | null
          settlement_id: string | null
          to_state: string
          transaction_id: string | null
        }
        Insert: {
          actor_user_id?: string | null
          created_at?: string
          from_state?: string | null
          id?: string
          meta?: Json
          reason?: string | null
          settlement_id?: string | null
          to_state: string
          transaction_id?: string | null
        }
        Update: {
          actor_user_id?: string | null
          created_at?: string
          from_state?: string | null
          id?: string
          meta?: Json
          reason?: string | null
          settlement_id?: string | null
          to_state?: string
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "settlement_state_transitions_settlement_id_fkey"
            columns: ["settlement_id"]
            isOneToOne: false
            referencedRelation: "provider_settlements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlement_state_transitions_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "provider_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_cases: {
        Row: {
          created_at: string
          decided_at: string | null
          decided_by: string | null
          decision_reason: string | null
          id: string
          provider_id: string
          status: Database["public"]["Enums"]["verification_status"]
          submitted_at: string | null
        }
        Insert: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_reason?: string | null
          id?: string
          provider_id: string
          status?: Database["public"]["Enums"]["verification_status"]
          submitted_at?: string | null
        }
        Update: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_reason?: string | null
          id?: string
          provider_id?: string
          status?: Database["public"]["Enums"]["verification_status"]
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "verification_cases_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "provider_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_reviews: {
        Row: {
          case_id: string
          created_at: string
          from_status: Database["public"]["Enums"]["verification_status"]
          id: string
          notes: string | null
          reviewer_id: string
          to_status: Database["public"]["Enums"]["verification_status"]
        }
        Insert: {
          case_id: string
          created_at?: string
          from_status: Database["public"]["Enums"]["verification_status"]
          id?: string
          notes?: string | null
          reviewer_id: string
          to_status: Database["public"]["Enums"]["verification_status"]
        }
        Update: {
          case_id?: string
          created_at?: string
          from_status?: Database["public"]["Enums"]["verification_status"]
          id?: string
          notes?: string | null
          reviewer_id?: string
          to_status?: Database["public"]["Enums"]["verification_status"]
        }
        Relationships: [
          {
            foreignKeyName: "verification_reviews_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "verification_cases"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cancel_maintenance_request: {
        Args: {
          idempotency_key_input: string
          reason_input: string
          request_id_input: string
        }
        Returns: Database["public"]["Tables"]["maintenance_requests"]["Row"]
      }
      register_maintenance_provider: {
        Args: {
          business_kind_input: Database["public"]["Enums"]["provider_business_type"]
          iban_input: string
          name_input: string
          phone_input?: string | null
          service_codes_input: string[]
        }
        Returns: Database["public"]["Tables"]["maintenance_providers"]["Row"]
      }
      reschedule_maintenance_request: {
        Args: {
          idempotency_key_input: string
          reason_input?: string | null
          request_id_input: string
          scheduled_date_input: string
          scheduled_time_input: string
        }
        Returns: Database["public"]["Tables"]["maintenance_requests"]["Row"]
      }
      accept_provider_offer: {
        Args: { idempotency_key_input: string; offer_id_input: string }
        Returns: {
          after_service_policy: string
          ai_generated: boolean
          ai_price_max: number | null
          ai_price_min: number | null
          ai_suggestions: Json
          ai_summary: string | null
          apartment_number: string | null
          appointment_status: string
          arrived_at: string | null
          building_id: string | null
          category: Database["public"]["Enums"]["maintenance_category"]
          completion_rework_count: number
          contact_phone: string | null
          created_at: string
          customer_address_id: string
          description: string | null
          en_route_at: string | null
          expired_at: string | null
          floor: string | null
          id: string
          idempotency_key: string
          last_activity_at: string
          location_note: string | null
          manager_notes: string | null
          offered_price: number | null
          original_completed_at: string | null
          partner_external_ref: string | null
          partner_id: string | null
          pricing_mode: Database["public"]["Enums"]["maintenance_pricing_mode"]
          priority: Database["public"]["Enums"]["maintenance_request_priority"]
          provider_id: string | null
          rating: number | null
          rating_comment: string | null
          ref_no: number
          repost_count: number
          request_lat: number | null
          request_lng: number | null
          scheduled_date: string | null
          scheduled_time: string | null
          service_code: string
          service_metadata: Json
          service_timing_mode: string
          source: string
          status: Database["public"]["Enums"]["maintenance_status"]
          tenant_id: string | null
          title: string
          type: Database["public"]["Enums"]["maintenance_type"]
          updated_at: string
          user_id: string
          warranty_count: number
          warranty_opened_at: string | null
          warranty_reason: string | null
          warranty_rejected_at: string | null
          warranty_rejection_reason: string | null
          warranty_resolved_at: string | null
          work_completed_at: string | null
          work_started_at: string | null
          workflow_type: string
        }
        SetofOptions: {
          from: "*"
          to: "maintenance_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      confirm_maintenance_payment: {
        Args: { invoice_id_input: string }
        Returns: {
          amount: number
          base_amount: number
          completion_proof_storage_path: string | null
          created_at: string
          description: string | null
          dispute_reason: string | null
          disputed_at: string | null
          id: string
          payment_confirmed: boolean
          payment_method: string | null
          platform_fee_amount: number
          platform_fee_percent: number
          provider_amount: number
          provider_confirmed_at: string | null
          provider_id: string
          provider_received: boolean
          provider_user_id: string
          receipt_storage_path: string | null
          ref_no: number
          request_id: string
          settlement_direction: string
          status: Database["public"]["Enums"]["provider_invoice_status"]
          updated_at: string
          user_id: string
          user_paid_at: string | null
          vat_amount: number
          vat_percent: number
        }
        SetofOptions: {
          from: "*"
          to: "provider_invoices"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      confirm_maintenance_work: {
        Args: { idempotency_key_input: string; request_id_input: string }
        Returns: {
          amount: number
          base_amount: number
          completion_proof_storage_path: string | null
          created_at: string
          description: string | null
          dispute_reason: string | null
          disputed_at: string | null
          id: string
          payment_confirmed: boolean
          payment_method: string | null
          platform_fee_amount: number
          platform_fee_percent: number
          provider_amount: number
          provider_confirmed_at: string | null
          provider_id: string
          provider_received: boolean
          provider_user_id: string
          receipt_storage_path: string | null
          ref_no: number
          request_id: string
          settlement_direction: string
          status: Database["public"]["Enums"]["provider_invoice_status"]
          updated_at: string
          user_id: string
          user_paid_at: string | null
          vat_amount: number
          vat_percent: number
        }
        SetofOptions: {
          from: "*"
          to: "provider_invoices"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      confirm_provider_settlement: {
        Args: { notes_input?: string; settlement_id_input: string }
        Returns: {
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          id: string
          initiator: Database["public"]["Enums"]["provider_settlement_initiator"]
          notes: string | null
          owner_notes: string | null
          period_from: string | null
          period_to: string | null
          provider_id: string
          provider_user_id: string
          receipt_storage_path: string | null
          ref_no: number
          settlement_direction: string
          status: Database["public"]["Enums"]["provider_settlement_status"]
          submitted_at: string | null
          total_amount: number
          transactions_count: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "provider_settlements"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_maintenance_request_atomic: {
        Args: {
          address_input: Json
          contact_phone_input?: string
          description_input: string
          idempotency_key_input?: string
          location_note_input?: string
          offered_price_input?: number
          pricing_mode_input?: Database["public"]["Enums"]["maintenance_pricing_mode"]
          priority_input?: Database["public"]["Enums"]["maintenance_request_priority"]
          scheduled_date_input?: string
          scheduled_time_input?: string
          service_code_input: string
          service_metadata_input?: Json
          timing_mode_input?: string
          title_input: string
        }
        Returns: {
          after_service_policy: string
          ai_generated: boolean
          ai_price_max: number | null
          ai_price_min: number | null
          ai_suggestions: Json
          ai_summary: string | null
          apartment_number: string | null
          appointment_status: string
          arrived_at: string | null
          building_id: string | null
          category: Database["public"]["Enums"]["maintenance_category"]
          completion_rework_count: number
          contact_phone: string | null
          created_at: string
          customer_address_id: string
          description: string | null
          en_route_at: string | null
          expired_at: string | null
          floor: string | null
          id: string
          idempotency_key: string
          last_activity_at: string
          location_note: string | null
          manager_notes: string | null
          offered_price: number | null
          original_completed_at: string | null
          partner_external_ref: string | null
          partner_id: string | null
          pricing_mode: Database["public"]["Enums"]["maintenance_pricing_mode"]
          priority: Database["public"]["Enums"]["maintenance_request_priority"]
          provider_id: string | null
          rating: number | null
          rating_comment: string | null
          ref_no: number
          repost_count: number
          request_lat: number | null
          request_lng: number | null
          scheduled_date: string | null
          scheduled_time: string | null
          service_code: string
          service_metadata: Json
          service_timing_mode: string
          source: string
          status: Database["public"]["Enums"]["maintenance_status"]
          tenant_id: string | null
          title: string
          type: Database["public"]["Enums"]["maintenance_type"]
          updated_at: string
          user_id: string
          warranty_count: number
          warranty_opened_at: string | null
          warranty_reason: string | null
          warranty_rejected_at: string | null
          warranty_rejection_reason: string | null
          warranty_resolved_at: string | null
          work_completed_at: string | null
          work_started_at: string | null
          workflow_type: string
        }
        SetofOptions: {
          from: "*"
          to: "maintenance_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_provider_settlement: {
        Args: never
        Returns: {
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          id: string
          initiator: Database["public"]["Enums"]["provider_settlement_initiator"]
          notes: string | null
          owner_notes: string | null
          period_from: string | null
          period_to: string | null
          provider_id: string
          provider_user_id: string
          receipt_storage_path: string | null
          ref_no: number
          settlement_direction: string
          status: Database["public"]["Enums"]["provider_settlement_status"]
          submitted_at: string | null
          total_amount: number
          transactions_count: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "provider_settlements"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_customer_service_catalog: {
        Args: never
        Returns: {
          after_service_policy: string
          code: string
          description_ar: string
          family_code: string
          legacy_category: Database["public"]["Enums"]["maintenance_category"]
          name_ar: string
          sort_order: number
          supports_fixed_price: boolean
          supports_offers: boolean
          workflow_type: string
        }[]
      }
      get_provider_opportunities: {
        Args: never
        Returns: {
          city: string
          created_at: string
          description: string
          district: string
          expires_at: string
          offer_id: string
          offer_status: Database["public"]["Enums"]["provider_offer_status"]
          offered_price: number
          pricing_mode: Database["public"]["Enums"]["maintenance_pricing_mode"]
          priority: Database["public"]["Enums"]["maintenance_request_priority"]
          quoted_at: string
          ref_no: number
          request_id: string
          scheduled_date: string
          scheduled_time: string
          service_code: string
          service_name_ar: string
          timing_mode: string
          title: string
        }[]
      }
      get_service_provider_availability: {
        Args: never
        Returns: {
          provider_count: number
          service_code: string
        }[]
      }
      open_maintenance_warranty: {
        Args: {
          idempotency_key_input: string
          reason_input: string
          request_id_input: string
        }
        Returns: {
          after_service_policy: string
          ai_generated: boolean
          ai_price_max: number | null
          ai_price_min: number | null
          ai_suggestions: Json
          ai_summary: string | null
          apartment_number: string | null
          appointment_status: string
          arrived_at: string | null
          building_id: string | null
          category: Database["public"]["Enums"]["maintenance_category"]
          completion_rework_count: number
          contact_phone: string | null
          created_at: string
          customer_address_id: string
          description: string | null
          en_route_at: string | null
          expired_at: string | null
          floor: string | null
          id: string
          idempotency_key: string
          last_activity_at: string
          location_note: string | null
          manager_notes: string | null
          offered_price: number | null
          original_completed_at: string | null
          partner_external_ref: string | null
          partner_id: string | null
          pricing_mode: Database["public"]["Enums"]["maintenance_pricing_mode"]
          priority: Database["public"]["Enums"]["maintenance_request_priority"]
          provider_id: string | null
          rating: number | null
          rating_comment: string | null
          ref_no: number
          repost_count: number
          request_lat: number | null
          request_lng: number | null
          scheduled_date: string | null
          scheduled_time: string | null
          service_code: string
          service_metadata: Json
          service_timing_mode: string
          source: string
          status: Database["public"]["Enums"]["maintenance_status"]
          tenant_id: string | null
          title: string
          type: Database["public"]["Enums"]["maintenance_type"]
          updated_at: string
          user_id: string
          warranty_count: number
          warranty_opened_at: string | null
          warranty_reason: string | null
          warranty_rejected_at: string | null
          warranty_rejection_reason: string | null
          warranty_resolved_at: string | null
          work_completed_at: string | null
          work_started_at: string | null
          workflow_type: string
        }
        SetofOptions: {
          from: "*"
          to: "maintenance_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      register_provider_document: {
        Args: {
          doc_type_input: Database["public"]["Enums"]["provider_document_type"]
          storage_path_input: string
        }
        Returns: {
          created_at: string
          doc_type: Database["public"]["Enums"]["provider_document_type"]
          id: string
          provider_user_id: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["provider_document_status"]
          storage_path: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "provider_documents"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      respond_to_provider_offer: {
        Args: {
          notes_input?: string
          offer_id_input: string
          offered_price_input?: number
          response_input: string
        }
        Returns: {
          created_at: string
          distance_km: number | null
          expires_at: string | null
          id: string
          notes: string | null
          offered_price: number | null
          provider_id: string
          provider_user_id: string
          quoted_at: string | null
          request_id: string
          responded_at: string | null
          status: Database["public"]["Enums"]["provider_offer_status"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "provider_offers"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      review_maintenance_provider: {
        Args: {
          decision_input: Database["public"]["Enums"]["provider_verification_status"]
          notes_input?: string
          provider_id_input: string
        }
        Returns: {
          account_holder: string | null
          avatar_url: string | null
          bank_name: string | null
          business_kind: Database["public"]["Enums"]["provider_business_type"]
          category: Database["public"]["Enums"]["maintenance_category"]
          created_at: string
          debt_limit: number | null
          estimated_price: number
          iban: string | null
          id: string
          is_active: boolean
          lat: number | null
          lng: number | null
          name: string
          phone: string | null
          rating: number | null
          rating_count: number
          response_time: string
          service_radius_km: number
          spoken_languages: string[]
          updated_at: string
          user_id: string
          vat_registration_number: string | null
          verification_notes: string | null
          verification_status: Database["public"]["Enums"]["provider_verification_status"]
          verified_at: string | null
          verified_by: string | null
        }
        SetofOptions: {
          from: "*"
          to: "maintenance_providers"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      submit_maintenance_payment: {
        Args: { invoice_id_input: string; payment_method_input?: string }
        Returns: {
          amount: number
          base_amount: number
          completion_proof_storage_path: string | null
          created_at: string
          description: string | null
          dispute_reason: string | null
          disputed_at: string | null
          id: string
          payment_confirmed: boolean
          payment_method: string | null
          platform_fee_amount: number
          platform_fee_percent: number
          provider_amount: number
          provider_confirmed_at: string | null
          provider_id: string
          provider_received: boolean
          provider_user_id: string
          receipt_storage_path: string | null
          ref_no: number
          request_id: string
          settlement_direction: string
          status: Database["public"]["Enums"]["provider_invoice_status"]
          updated_at: string
          user_id: string
          user_paid_at: string | null
          vat_amount: number
          vat_percent: number
        }
        SetofOptions: {
          from: "*"
          to: "provider_invoices"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      submit_provider_settlement_receipt: {
        Args: { receipt_path_input: string; settlement_id_input: string }
        Returns: {
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          id: string
          initiator: Database["public"]["Enums"]["provider_settlement_initiator"]
          notes: string | null
          owner_notes: string | null
          period_from: string | null
          period_to: string | null
          provider_id: string
          provider_user_id: string
          receipt_storage_path: string | null
          ref_no: number
          settlement_direction: string
          status: Database["public"]["Enums"]["provider_settlement_status"]
          submitted_at: string | null
          total_amount: number
          transactions_count: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "provider_settlements"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      submit_provider_verification: {
        Args: never
        Returns: {
          account_holder: string | null
          avatar_url: string | null
          bank_name: string | null
          business_kind: Database["public"]["Enums"]["provider_business_type"]
          category: Database["public"]["Enums"]["maintenance_category"]
          created_at: string
          debt_limit: number | null
          estimated_price: number
          iban: string | null
          id: string
          is_active: boolean
          lat: number | null
          lng: number | null
          name: string
          phone: string | null
          rating: number | null
          rating_count: number
          response_time: string
          service_radius_km: number
          spoken_languages: string[]
          updated_at: string
          user_id: string
          vat_registration_number: string | null
          verification_notes: string | null
          verification_status: Database["public"]["Enums"]["provider_verification_status"]
          verified_at: string | null
          verified_by: string | null
        }
        SetofOptions: {
          from: "*"
          to: "maintenance_providers"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      transition_maintenance_request: {
        Args: {
          expected_status_input: Database["public"]["Enums"]["maintenance_status"]
          idempotency_key_input: string
          payload_input?: Json
          request_id_input: string
          target_status_input: Database["public"]["Enums"]["maintenance_status"]
        }
        Returns: {
          after_service_policy: string
          ai_generated: boolean
          ai_price_max: number | null
          ai_price_min: number | null
          ai_suggestions: Json
          ai_summary: string | null
          apartment_number: string | null
          appointment_status: string
          arrived_at: string | null
          building_id: string | null
          category: Database["public"]["Enums"]["maintenance_category"]
          completion_rework_count: number
          contact_phone: string | null
          created_at: string
          customer_address_id: string
          description: string | null
          en_route_at: string | null
          expired_at: string | null
          floor: string | null
          id: string
          idempotency_key: string
          last_activity_at: string
          location_note: string | null
          manager_notes: string | null
          offered_price: number | null
          original_completed_at: string | null
          partner_external_ref: string | null
          partner_id: string | null
          pricing_mode: Database["public"]["Enums"]["maintenance_pricing_mode"]
          priority: Database["public"]["Enums"]["maintenance_request_priority"]
          provider_id: string | null
          rating: number | null
          rating_comment: string | null
          ref_no: number
          repost_count: number
          request_lat: number | null
          request_lng: number | null
          scheduled_date: string | null
          scheduled_time: string | null
          service_code: string
          service_metadata: Json
          service_timing_mode: string
          source: string
          status: Database["public"]["Enums"]["maintenance_status"]
          tenant_id: string | null
          title: string
          type: Database["public"]["Enums"]["maintenance_type"]
          updated_at: string
          user_id: string
          warranty_count: number
          warranty_opened_at: string | null
          warranty_reason: string | null
          warranty_rejected_at: string | null
          warranty_rejection_reason: string | null
          warranty_resolved_at: string | null
          work_completed_at: string | null
          work_started_at: string | null
          workflow_type: string
        }
        SetofOptions: {
          from: "*"
          to: "maintenance_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      transition_service_request: {
        Args: {
          command_key: string
          event_payload?: Json
          expected_status: Database["public"]["Enums"]["request_status"]
          next_status: Database["public"]["Enums"]["request_status"]
          target_request: string
        }
        Returns: {
          address_id: string
          completed_at: string | null
          created_at: string
          customer_id: string
          description: string
          id: string
          idempotency_key: string
          partner_external_ref: string | null
          partner_id: string | null
          request_number: number
          service_id: string
          status: Database["public"]["Enums"]["request_status"]
          submitted_at: string | null
          title: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "service_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      maintenance_category:
        | "plumbing"
        | "electrical"
        | "general"
        | "elevator"
        | "cleaning"
        | "other"
        | "hvac"
      maintenance_pricing_mode: "price" | "offers"
      maintenance_request_priority: "normal" | "urgent" | "emergency"
      maintenance_status:
        | "new"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "waiting_confirmation"
        | "waiting_payment"
        | "inactive"
        | "accepted"
        | "arrived"
        | "warranty_requested"
        | "warranty_in_progress"
        | "warranty_waiting_confirmation"
        | "warranty_resolved"
        | "warranty_rejected"
      maintenance_type: "building" | "unit"
      partner_role: "partner_admin"
      platform_role:
        | "platform_owner"
        | "platform_operator"
        | "compliance_reviewer"
        | "finance_operator"
        | "support_agent"
      provider_business_type: "company" | "individual"
      provider_document_status: "pending" | "approved" | "rejected"
      provider_document_type:
        | "id_card"
        | "commercial_registration"
        | "bank_iban"
      provider_invoice_status:
        | "pending_payment"
        | "payment_submitted"
        | "paid"
        | "cancelled"
        | "disputed"
        | "auto_confirmed"
      provider_offer_status: "pending" | "accepted" | "declined" | "expired"
      provider_role: "provider_owner" | "provider_dispatcher" | "technician"
      provider_settlement_initiator: "provider" | "owner"
      provider_settlement_status:
        | "pending_payment"
        | "payment_submitted"
        | "confirmed"
        | "cancelled"
      provider_transaction_status: "pending" | "paid"
      provider_verification_status:
        | "pending"
        | "approved"
        | "rejected"
        | "under_review"
        | "suspended"
        | "needs_completion"
      request_status:
        | "draft"
        | "submitted"
        | "triaged"
        | "quoting"
        | "customer_confirmed"
        | "assigned"
        | "scheduled"
        | "en_route"
        | "arrived"
        | "in_progress"
        | "work_completed"
        | "awaiting_customer_acceptance"
        | "completed"
        | "cancelled"
        | "expired"
        | "disputed"
        | "rework_required"
        | "on_hold"
      verification_status:
        | "draft"
        | "submitted"
        | "under_review"
        | "approved"
        | "rejected"
        | "suspended"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      maintenance_category: [
        "plumbing",
        "electrical",
        "general",
        "elevator",
        "cleaning",
        "other",
        "hvac",
      ],
      maintenance_pricing_mode: ["price", "offers"],
      maintenance_request_priority: ["normal", "urgent", "emergency"],
      maintenance_status: [
        "new",
        "in_progress",
        "completed",
        "cancelled",
        "waiting_confirmation",
        "waiting_payment",
        "inactive",
        "accepted",
        "arrived",
        "warranty_requested",
        "warranty_in_progress",
        "warranty_waiting_confirmation",
        "warranty_resolved",
        "warranty_rejected",
      ],
      maintenance_type: ["building", "unit"],
      partner_role: ["partner_admin"],
      platform_role: [
        "platform_owner",
        "platform_operator",
        "compliance_reviewer",
        "finance_operator",
        "support_agent",
      ],
      provider_business_type: ["company", "individual"],
      provider_document_status: ["pending", "approved", "rejected"],
      provider_document_type: [
        "id_card",
        "commercial_registration",
        "bank_iban",
      ],
      provider_invoice_status: [
        "pending_payment",
        "payment_submitted",
        "paid",
        "cancelled",
        "disputed",
        "auto_confirmed",
      ],
      provider_offer_status: ["pending", "accepted", "declined", "expired"],
      provider_role: ["provider_owner", "provider_dispatcher", "technician"],
      provider_settlement_initiator: ["provider", "owner"],
      provider_settlement_status: [
        "pending_payment",
        "payment_submitted",
        "confirmed",
        "cancelled",
      ],
      provider_transaction_status: ["pending", "paid"],
      provider_verification_status: [
        "pending",
        "approved",
        "rejected",
        "under_review",
        "suspended",
        "needs_completion",
      ],
      request_status: [
        "draft",
        "submitted",
        "triaged",
        "quoting",
        "customer_confirmed",
        "assigned",
        "scheduled",
        "en_route",
        "arrived",
        "in_progress",
        "work_completed",
        "awaiting_customer_acceptance",
        "completed",
        "cancelled",
        "expired",
        "disputed",
        "rework_required",
        "on_hold",
      ],
      verification_status: [
        "draft",
        "submitted",
        "under_review",
        "approved",
        "rejected",
        "suspended",
      ],
    },
  },
} as const

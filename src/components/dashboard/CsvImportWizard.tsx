import { ReactSpreadsheetImport } from "react-spreadsheet-import";
import { supabase } from "../../lib/supabase";
import { useState } from "react";

interface CsvImportWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  cycleId: string | null; // We need this to link the data correctly!
}

// 1. Define your schema (The columns you WANT)
const fields = [
  {
    label: "Company Name",
    key: "company_name",
    alternateMatches: ["company", "vendor", "supplier", "business name"],
    fieldType: {
      type: "input",
    },
    validations: [
      {
        rule: "required",
        errorMessage: "Company Name is required",
      },
    ],
  },
  {
    label: "Contact Email",
    key: "contact_email",
    alternateMatches: ["email", "contact", "email address"],
    fieldType: {
      type: "input",
    },
  },
  {
    label: "Country",
    key: "country",
    alternateMatches: ["region", "location", "jurisdiction"],
    fieldType: {
      type: "input",
    },
    validations: [
      {
        rule: "required",
        errorMessage: "Country is required for Risk Analysis",
      },
    ],
  },
] as const;

export function CsvImportWizard({ isOpen, onClose, onSuccess, cycleId }: CsvImportWizardProps) {
  // Risk Analysis Logic (Reused)
  const analyzeRisk = (country: string) => {
    const highRiskCountries = ['China', 'India', 'Vietnam', 'Russia', 'Myanmar', 'North Korea'];
    return highRiskCountries.some(r => country?.toLowerCase().includes(r.toLowerCase())) ? 'HIGH' : 'LOW';
  };

  const handleSubmit = async (data: any) => {
    if (!cycleId) {
      alert("System Error: No active reporting cycle found.");
      return;
    }

    // data.validData contains the clean rows mapped to your keys
    const rows = data.validData;
    let successCount = 0;

    // We process sequentially to ensure relationships are built correctly
    for (const row of rows) {
      try {
        // 1. Create Global Vendor
        // Note: In a real app, you might want to "upsert" (check if exists first)
        // based on email or name to avoid duplicates.
        const { data: vendor, error: vErr } = await supabase
          .from('vendors')
          .insert({
            company_name: row.company_name,
            contact_email: row.contact_email || '',
            country: row.country
          })
          .select()
          .single();

        if (vErr) throw vErr;

        // 2. Link to Reporting Cycle
        const riskLevel = analyzeRisk(row.country);

        const { error: lErr } = await supabase.from('company_vendors').insert({
          reporting_cycle_id: cycleId,
          vendor_id: vendor.id,
          risk_status: riskLevel,
          verification_status: 'PENDING'
        });

        if (!lErr) successCount++;

      } catch (err) {
        console.error("Import failed for row", row, err);
      }
    }

    alert(`Successfully imported ${successCount} vendors!`);
    onSuccess(); // Refresh dashboard
    onClose();   // Close modal
  };

  return (
    <ReactSpreadsheetImport
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      fields={fields}
      customTheme={{
        colors: {
          // You can customize colors here to match your Tailwind theme if needed
          // primary: '#2563eb', 
        }
      }}
    />
  );
}
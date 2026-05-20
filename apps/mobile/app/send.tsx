import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MOCK_CONTACTS, type Contact } from "@/lib/mock-data";
import { apiFetch } from "@/lib/api-client";

// ─── Types ────────────────────────────────────────────────────────────────────

type TransferType = "local-bank" | "international" | "between-accounts" | "contacts" | "finmy";
type Recurrence = "once" | "weekly" | "monthly" | "yearly";
type Step = "type" | "recipient" | "amount" | "schedule" | "success";

type FinmyUser = { id: string; name: string; email: string; initials: string; color: string };

type WalletAccount = { id: string; label: string; number: string; balanceSar: number };

type Recipient =
  | { kind: "contact"; contact: Contact }
  | { kind: "account"; account: WalletAccount }
  | { kind: "bank"; iban: string; name: string; bank: string }
  | { kind: "international"; iban: string; swift: string; bank: string; country: string }
  | { kind: "finmy-user"; user: FinmyUser };

function getRecipientName(recipient: Recipient | null, fallback = ""): string {
  if (!recipient) return fallback;
  switch (recipient.kind) {
    case "contact": return recipient.contact.name;
    case "finmy-user": return recipient.user.name;
    case "account": return recipient.account.label;
    case "bank": return recipient.name;
    case "international": return recipient.iban;
  }
}

const TRANSFER_TYPES: {
  type: TransferType;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sub: string;
}[] = [
  {
    type: "local-bank",
    icon: "business-outline",
    label: "Local Bank",
    sub: "Transfer to any Saudi bank via IBAN",
  },
  {
    type: "international",
    icon: "globe-outline",
    label: "International",
    sub: "Send abroad with SWIFT/BIC",
  },
  {
    type: "between-accounts",
    icon: "swap-horizontal-outline",
    label: "Between Accounts",
    sub: "Move money across your accounts",
  },
  {
    type: "contacts",
    icon: "people-outline",
    label: "To Contacts",
    sub: "Send to a saved contact",
  },
  {
    type: "finmy",
    icon: "flash-outline",
    label: "Within finmy",
    sub: "Instant transfer to finmy users",
  },
];

const RECURRENCES: { value: Recurrence; label: string }[] = [
  { value: "once", label: "Once" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function SendScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>("type");
  const [transferType, setTransferType] = useState<TransferType | null>(null);
  const [scheduled, setScheduled] = useState(false);
  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [scheduleDate, setScheduleDate] = useState(new Date(Date.now() + 86400000));
  const [recurrence, setRecurrence] = useState<Recurrence>("once");
  const [loading, setLoading] = useState(false);
  const [newBalanceSar, setNewBalanceSar] = useState<number | null>(null);

  // Local bank form
  const [iban, setIban] = useState("");
  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [bankName, setBankName] = useState("");
  // International extras
  const [swift, setSwift] = useState("");
  const [country, setCountry] = useState("");
  // Contact search
  const [search, setSearch] = useState("");

  const filteredContacts = MOCK_CONTACTS.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.handle.toLowerCase().includes(search.toLowerCase())
  );

  function goBack() {
    if (step === "recipient") {
      setStep("type");
      return;
    }
    if (step === "amount") {
      setStep("recipient");
      return;
    }
    if (step === "schedule") {
      setStep("amount");
      return;
    }
    router.back();
  }

  function onTypeSelect(type: TransferType) {
    setTransferType(type);
    setStep("recipient");
  }

  function onRecipientNext() {
    setStep("amount");
  }

  function onAmountNext() {
    if (scheduled) {
      setStep("schedule");
      return;
    }
    submit();
  }

  async function submit() {
    if (transferType === "finmy" && recipient?.kind === "finmy-user") {
      setLoading(true);
      try {
        const res = await apiFetch("/api/wallet/send", {
          method: "POST",
          body: JSON.stringify({
            toEmail: recipient.user.email,
            amountSar: parseFloat(amount),
            ...(note ? { description: note } : {}),
          }),
        });
        const data = await res.json() as { newBalanceSar?: number; error?: string };
        if (!res.ok) {
          Alert.alert("Transfer failed", data.error ?? "Something went wrong");
          return;
        }
        setNewBalanceSar(data.newBalanceSar ?? null);
        queryClient.invalidateQueries({ queryKey: ["wallet"] });
        setStep("success");
      } catch {
        Alert.alert("Transfer failed", "Could not connect. Check your connection.");
      } finally {
        setLoading(false);
      }
      return;
    }
    // Non-finmy transfer types (bank, international, contacts) — mock flow until real integrations land
    setLoading(true);
    await new Promise((r) => setTimeout(r, 900));
    setLoading(false);
    queryClient.invalidateQueries({ queryKey: ["wallet"] });
    setStep("success");
  }

  const headerTitle: Record<Step, string> = {
    type: "Send Money",
    recipient: "Recipient",
    amount: "Enter Amount",
    schedule: "Schedule Transfer",
    success: "",
  };

  if (step === "success")
    return (
      <SuccessView
        amount={amount}
        recipient={recipient}
        scheduled={scheduled}
        scheduleDate={scheduleDate}
        newBalanceSar={newBalanceSar}
      />
    );

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={goBack}>
          <Ionicons name="chevron-back" size={24} color="#1A1426" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{headerTitle[step]}</Text>
        <View style={{ width: 24 }} />
      </View>

      {step === "type" && (
        <TypeStep
          scheduled={scheduled}
          onToggleScheduled={() => setScheduled((v) => !v)}
          onSelect={onTypeSelect}
        />
      )}
      {step === "recipient" && transferType === "local-bank" && (
        <LocalBankStep
          iban={iban}
          onIban={setIban}
          name={beneficiaryName}
          onName={setBeneficiaryName}
          bank={bankName}
          onBank={setBankName}
          onNext={() => {
            setRecipient({ kind: "bank", iban, name: beneficiaryName, bank: bankName });
            onRecipientNext();
          }}
        />
      )}
      {step === "recipient" && transferType === "international" && (
        <InternationalStep
          iban={iban}
          onIban={setIban}
          swift={swift}
          onSwift={setSwift}
          bank={bankName}
          onBank={setBankName}
          country={country}
          onCountry={setCountry}
          onNext={() => {
            setRecipient({ kind: "international", iban, swift, bank: bankName, country });
            onRecipientNext();
          }}
        />
      )}
      {step === "recipient" && transferType === "between-accounts" && (
        <AccountStep
          onSelect={(acc) => {
            setRecipient({ kind: "account", account: acc });
            onRecipientNext();
          }}
        />
      )}
      {step === "recipient" && transferType === "contacts" && (
        <ContactStep
          search={search}
          onSearch={setSearch}
          contacts={filteredContacts}
          label="Recent"
          onSelect={(c) => {
            setRecipient({ kind: "contact", contact: c });
            onRecipientNext();
          }}
        />
      )}
      {step === "recipient" && transferType === "finmy" && (
        <FinmyContactStep
          onSelect={(u) => {
            setRecipient({ kind: "finmy-user", user: u });
            onRecipientNext();
          }}
        />
      )}
      {step === "amount" && (
        <AmountStep
          recipient={recipient}
          amount={amount}
          onAmount={setAmount}
          note={note}
          onNote={setNote}
          scheduled={scheduled}
          loading={loading}
          onNext={onAmountNext}
        />
      )}
      {step === "schedule" && (
        <ScheduleStep
          date={scheduleDate}
          onDate={setScheduleDate}
          recurrence={recurrence}
          onRecurrence={setRecurrence}
          loading={loading}
          onConfirm={submit}
        />
      )}
    </KeyboardAvoidingView>
  );
}

// ─── Step: Type selection ─────────────────────────────────────────────────────

function TypeStep({
  scheduled,
  onToggleScheduled,
  onSelect,
}: {
  scheduled: boolean;
  onToggleScheduled: () => void;
  onSelect: (t: TransferType) => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <TouchableOpacity
        style={[styles.scheduledToggle, scheduled && styles.scheduledToggleOn]}
        onPress={onToggleScheduled}
        activeOpacity={0.8}
      >
        <View style={[styles.scheduledToggleIcon, scheduled && styles.scheduledToggleIconOn]}>
          <Ionicons name="calendar-outline" size={18} color={scheduled ? "white" : "#7C3AED"} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.scheduledToggleLabel, scheduled && styles.scheduledToggleLabelOn]}>
            Scheduled Transfer
          </Text>
          <Text style={[styles.scheduledToggleSub, scheduled && styles.scheduledToggleSubOn]}>
            {scheduled ? "Will ask for date after amount" : "Send on a future date or repeat"}
          </Text>
        </View>
        <View style={[styles.togglePill, scheduled && styles.togglePillOn]}>
          <View style={[styles.toggleThumb, scheduled && styles.toggleThumbOn]} />
        </View>
      </TouchableOpacity>

      <Text style={styles.listLabel}>Transfer type</Text>

      {TRANSFER_TYPES.map((t) => (
        <TouchableOpacity
          key={t.type}
          style={styles.typeCard}
          onPress={() => onSelect(t.type)}
          activeOpacity={0.7}
        >
          <View style={styles.typeIconWrap}>
            <Ionicons name={t.icon} size={22} color="#7C3AED" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.typeLabel}>{t.label}</Text>
            <Text style={styles.typeSub}>{t.sub}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// ─── Step: Local bank ─────────────────────────────────────────────────────────

function LocalBankStep({
  iban,
  onIban,
  name,
  onName,
  bank,
  onBank,
  onNext,
}: {
  iban: string;
  onIban: (v: string) => void;
  name: string;
  onName: (v: string) => void;
  bank: string;
  onBank: (v: string) => void;
  onNext: () => void;
}) {
  const valid = iban.length >= 15 && name.trim().length > 0;
  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <FormField
        label="IBAN"
        placeholder="SA00 0000 0000 0000 0000 0000"
        value={iban}
        onChangeText={onIban}
        autoCapitalize="characters"
      />
      <FormField
        label="Beneficiary Name"
        placeholder="Full name on account"
        value={name}
        onChangeText={onName}
      />
      <FormField
        label="Bank Name (optional)"
        placeholder="e.g. Al Rajhi Bank"
        value={bank}
        onChangeText={onBank}
      />
      <TouchableOpacity
        style={[styles.cta, !valid && styles.ctaDisabled]}
        onPress={onNext}
        disabled={!valid}
      >
        <Text style={styles.ctaText}>Continue</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── Step: International ──────────────────────────────────────────────────────

function InternationalStep({
  iban,
  onIban,
  swift,
  onSwift,
  bank,
  onBank,
  country,
  onCountry,
  onNext,
}: {
  iban: string;
  onIban: (v: string) => void;
  swift: string;
  onSwift: (v: string) => void;
  bank: string;
  onBank: (v: string) => void;
  country: string;
  onCountry: (v: string) => void;
  onNext: () => void;
}) {
  const valid = iban.trim().length > 0 && swift.trim().length >= 8 && country.trim().length > 0;
  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <FormField
        label="Account / IBAN"
        placeholder="Account number or IBAN"
        value={iban}
        onChangeText={onIban}
        autoCapitalize="characters"
      />
      <FormField
        label="SWIFT / BIC"
        placeholder="8 or 11 characters"
        value={swift}
        onChangeText={onSwift}
        autoCapitalize="characters"
      />
      <FormField
        label="Bank Name"
        placeholder="Receiving bank name"
        value={bank}
        onChangeText={onBank}
      />
      <FormField
        label="Country"
        placeholder="e.g. United Arab Emirates"
        value={country}
        onChangeText={onCountry}
      />
      <TouchableOpacity
        style={[styles.cta, !valid && styles.ctaDisabled]}
        onPress={onNext}
        disabled={!valid}
      >
        <Text style={styles.ctaText}>Continue</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── Step: Between accounts ───────────────────────────────────────────────────

function AccountStep({ onSelect }: { onSelect: (a: WalletAccount) => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ["wallet"],
    queryFn: async () => {
      const res = await apiFetch("/api/wallet");
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<{ wallet: { id: string; iban: string; balanceSar: number } }>;
    },
  });

  const account: WalletAccount | null = data
    ? {
        id: data.wallet.id,
        label: "Main Account",
        number: `•••• ${data.wallet.iban.slice(-4)}`,
        balanceSar: data.wallet.balanceSar,
      }
    : null;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.listLabel}>Your accounts</Text>
      {isLoading || !account ? (
        <ActivityIndicator color="#7C3AED" style={{ marginTop: 24 }} />
      ) : (
        <TouchableOpacity
          style={styles.accountCard}
          onPress={() => onSelect(account)}
          activeOpacity={0.7}
        >
          <View style={styles.accountIconWrap}>
            <Ionicons name="wallet-outline" size={20} color="#7C3AED" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.accountLabel}>{account.label}</Text>
            <Text style={styles.accountNumber}>{account.number}</Text>
          </View>
          <Text style={styles.accountBalance}>
            SAR {account.balanceSar.toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

// ─── Step: Contact picker ─────────────────────────────────────────────────────

function ContactStep({
  search,
  onSearch,
  contacts,
  label,
  onSelect,
}: {
  search: string;
  onSearch: (v: string) => void;
  contacts: Contact[];
  label: string;
  onSelect: (c: Contact) => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={16} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or handle"
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={onSearch}
          autoCorrect={false}
        />
      </View>
      <Text style={styles.listLabel}>{label}</Text>
      {contacts.map((c) => (
        <TouchableOpacity
          key={c.id}
          style={styles.contactRow}
          onPress={() => onSelect(c)}
          activeOpacity={0.7}
        >
          <View style={[styles.avatar, { backgroundColor: c.color }]}>
            <Text style={styles.avatarText}>{c.initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.contactName}>{c.name}</Text>
            <Text style={styles.contactHandle}>{c.handle}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// ─── Step: Amount ─────────────────────────────────────────────────────────────

function AmountStep({
  recipient,
  amount,
  onAmount,
  note,
  onNote,
  scheduled,
  loading,
  onNext,
}: {
  recipient: Recipient | null;
  amount: string;
  onAmount: (v: string) => void;
  note: string;
  onNote: (v: string) => void;
  scheduled: boolean;
  loading: boolean;
  onNext: () => void;
}) {
  const recipientName = getRecipientName(recipient);
  const valid = !!amount && parseFloat(amount) > 0;

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {recipientName ? (
        <View style={styles.recipientChip}>
          <Ionicons name="person-circle-outline" size={18} color="#7C3AED" />
          <Text style={styles.recipientChipText} numberOfLines={1}>
            {recipientName}
          </Text>
        </View>
      ) : null}

      <View style={styles.amountWrap}>
        <Text style={styles.currencyPrefix}>SAR</Text>
        <TextInput
          style={styles.amountInput}
          placeholder="0.00"
          placeholderTextColor="#D1D5DB"
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={onAmount}
          autoFocus
        />
      </View>

      <View style={styles.quickAmounts}>
        {["50", "100", "200", "500"].map((q) => (
          <TouchableOpacity key={q} style={styles.quickChip} onPress={() => onAmount(q)}>
            <Text style={styles.quickChipText}>SAR {q}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.noteWrap}>
        <Ionicons name="chatbubble-outline" size={16} color="#9CA3AF" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.noteInput}
          placeholder="Add a note (optional)"
          placeholderTextColor="#9CA3AF"
          value={note}
          onChangeText={onNote}
        />
      </View>

      {scheduled ? (
        <View style={styles.scheduleHint}>
          <Ionicons name="calendar-outline" size={14} color="#7C3AED" />
          <Text style={styles.scheduleHintText}>You'll set the date on the next step</Text>
        </View>
      ) : null}

      <TouchableOpacity
        style={[styles.cta, !valid && styles.ctaDisabled]}
        onPress={onNext}
        disabled={!valid || loading}
      >
        <Text style={styles.ctaText}>
          {loading
            ? "Processing…"
            : scheduled
              ? "Set Schedule"
              : `Send SAR ${parseFloat(amount || "0").toFixed(2)}`}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── Step: Schedule ───────────────────────────────────────────────────────────

function ScheduleStep({
  date,
  onDate,
  recurrence,
  onRecurrence,
  loading,
  onConfirm,
}: {
  date: Date;
  onDate: (d: Date) => void;
  recurrence: Recurrence;
  onRecurrence: (r: Recurrence) => void;
  loading: boolean;
  onConfirm: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.scheduleLabel}>Transfer date</Text>
      <View style={styles.datePickerWrap}>
        <DateTimePicker
          value={date}
          mode="date"
          display="inline"
          minimumDate={new Date()}
          onChange={(_, d) => d && onDate(d)}
          accentColor="#7C3AED"
          themeVariant="light"
        />
      </View>

      <Text style={styles.scheduleLabel}>Repeat</Text>
      <View style={styles.recurrenceRow}>
        {RECURRENCES.map((r) => (
          <TouchableOpacity
            key={r.value}
            style={[styles.recurrenceChip, recurrence === r.value && styles.recurrenceChipOn]}
            onPress={() => onRecurrence(r.value)}
          >
            <Text
              style={[styles.recurrenceText, recurrence === r.value && styles.recurrenceTextOn]}
            >
              {r.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.cta}
        onPress={onConfirm}
        disabled={loading}
        activeOpacity={0.8}
      >
        <Text style={styles.ctaText}>{loading ? "Scheduling…" : "Confirm Schedule"}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── Success ──────────────────────────────────────────────────────────────────

function SuccessView({
  amount,
  recipient,
  scheduled,
  scheduleDate,
  newBalanceSar,
}: {
  amount: string;
  recipient: Recipient | null;
  scheduled: boolean;
  scheduleDate: Date;
  newBalanceSar: number | null;
}) {
  const recipientName = getRecipientName(recipient, "recipient");

  const dateStr = scheduleDate.toLocaleDateString("en-SA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <View style={[styles.root, styles.successRoot]}>
      <View style={styles.successCircle}>
        <Ionicons name={scheduled ? "calendar" : "checkmark"} size={40} color="white" />
      </View>
      <Text style={styles.successTitle}>{scheduled ? "Transfer Scheduled" : "Sent"}</Text>
      <Text style={styles.successAmount}>SAR {parseFloat(amount || "0").toFixed(2)}</Text>
      <Text style={styles.successTo}>to {recipientName}</Text>
      {scheduled ? <Text style={styles.successDate}>on {dateStr}</Text> : null}
      {newBalanceSar !== null ? (
        <Text style={styles.successNewBalance}>New balance: SAR {newBalanceSar.toFixed(2)}</Text>
      ) : null}
      <TouchableOpacity style={styles.successDone} onPress={() => router.back()}>
        <Text style={styles.successDoneText}>Done</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Step: finmy user picker ──────────────────────────────────────────────────

function FinmyContactStep({ onSelect }: { onSelect: (u: FinmyUser) => void }) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<FinmyUser[]>([]);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    const q = search.trim();
    if (!q) {
      setResults((prev) => (prev.length > 0 ? [] : prev));
      return;
    }
    let cancelled = false;
    setFetching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await apiFetch(`/api/users/search?q=${encodeURIComponent(q)}`);
        if (!cancelled && res.ok) {
          const data = await res.json() as { users: FinmyUser[] };
          setResults(data.users);
        }
      } catch {
        // transient network failure — leave last results visible
      } finally {
        if (!cancelled) setFetching(false);
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search]);

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={16} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Name or email"
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
          autoFocus
        />
        {fetching ? <ActivityIndicator size="small" color="#7C3AED" /> : null}
      </View>
      <Text style={styles.listLabel}>finmy users</Text>
      {!search.trim() ? (
        <Text style={styles.finmyHint}>Type a name or email to search</Text>
      ) : results.length === 0 && !fetching ? (
        <Text style={styles.finmyHint}>No users found</Text>
      ) : null}
      {results.map((u) => (
        <TouchableOpacity
          key={u.id}
          style={styles.contactRow}
          onPress={() => onSelect(u)}
          activeOpacity={0.7}
        >
          <View style={[styles.avatar, { backgroundColor: u.color }]}>
            <Text style={styles.avatarText}>{u.initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.contactName}>{u.name}</Text>
            <Text style={styles.contactHandle}>{u.email}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// ─── Shared form field ────────────────────────────────────────────────────────

function FormField({
  label,
  placeholder,
  value,
  onChangeText,
  autoCapitalize,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
}) {
  return (
    <View style={styles.formField}>
      <Text style={styles.formLabel}>{label}</Text>
      <TextInput
        style={styles.formInput}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        value={value}
        onChangeText={onChangeText}
        autoCapitalize={autoCapitalize ?? "words"}
        autoCorrect={false}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FAFAFA" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerTitle: { fontSize: 17, fontFamily: "PlusJakartaSans_700Bold", color: "#1A1426" },
  content: { padding: 20, paddingBottom: 48 },

  // Scheduled toggle
  scheduledToggle: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 14,
    marginBottom: 24,
    gap: 12,
    borderWidth: 1.5,
    borderColor: "#F3F4F6",
  },
  scheduledToggleOn: { borderColor: "#7C3AED", backgroundColor: "#F4F1FA" },
  scheduledToggleIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F4F1FA",
    alignItems: "center",
    justifyContent: "center",
  },
  scheduledToggleIconOn: { backgroundColor: "#7C3AED" },
  scheduledToggleLabel: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#1A1426",
    marginBottom: 2,
  },
  scheduledToggleLabelOn: { color: "#7C3AED" },
  scheduledToggleSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#9CA3AF" },
  scheduledToggleSubOn: { color: "#7C3AED" },
  togglePill: {
    width: 42,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  togglePillOn: { backgroundColor: "#7C3AED" },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "white",
    alignSelf: "flex-start",
  },
  toggleThumbOn: { alignSelf: "flex-end" },

  listLabel: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#9CA3AF", marginBottom: 10 },

  // Transfer type cards
  typeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  typeIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F4F1FA",
    alignItems: "center",
    justifyContent: "center",
  },
  typeLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#1A1426", marginBottom: 2 },
  typeSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#9CA3AF" },

  // Account cards
  accountCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  accountIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F4F1FA",
    alignItems: "center",
    justifyContent: "center",
  },
  accountLabel: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#1A1426",
    marginBottom: 2,
  },
  accountNumber: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#9CA3AF" },
  accountBalance: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#1A1426" },

  // Contact picker
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    height: 48,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular", color: "#1A1426" },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: { color: "white", fontFamily: "Inter_600SemiBold", fontSize: 14 },
  contactName: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#1A1426", marginBottom: 2 },
  contactHandle: { fontSize: 13, color: "#9CA3AF", fontFamily: "Inter_400Regular" },

  // Amount step
  recipientChip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: 6,
    backgroundColor: "#F4F1FA",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginBottom: 24,
    maxWidth: "80%",
  },
  recipientChipText: { fontSize: 14, fontFamily: "Inter_500Medium", color: "#7C3AED" },
  amountWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  currencyPrefix: {
    fontSize: 28,
    fontFamily: "Inter_400Regular",
    color: "#9CA3AF",
    marginRight: 8,
    marginTop: 6,
  },
  amountInput: {
    fontSize: 52,
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#1A1426",
    minWidth: 120,
    textAlign: "center",
  },
  quickAmounts: { flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 24 },
  quickChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#F4F1FA",
    borderRadius: 20,
  },
  quickChipText: { fontSize: 13, color: "#7C3AED", fontFamily: "Inter_500Medium" },
  noteWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  noteInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular", color: "#1A1426" },
  scheduleHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 24,
    paddingHorizontal: 2,
  },
  scheduleHintText: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#7C3AED" },

  // Form fields
  formField: { marginBottom: 16 },
  formLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "#6B7280",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  formInput: {
    backgroundColor: "white",
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 50,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: "#1A1426",
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },

  // Schedule step
  scheduleLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "#9CA3AF",
    marginBottom: 10,
  },
  datePickerWrap: {
    backgroundColor: "white",
    borderRadius: 16,
    marginBottom: 24,
    overflow: "hidden",
  },
  recurrenceRow: { flexDirection: "row", gap: 8, marginBottom: 32, flexWrap: "wrap" },
  recurrenceChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "white",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
  },
  recurrenceChipOn: { backgroundColor: "#7C3AED", borderColor: "#7C3AED" },
  recurrenceText: { fontSize: 14, fontFamily: "Inter_500Medium", color: "#6B7280" },
  recurrenceTextOn: { color: "white" },

  // CTA
  cta: {
    backgroundColor: "#7C3AED",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  ctaDisabled: { backgroundColor: "#E5E7EB" },
  ctaText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "white" },

  // Success
  successRoot: { alignItems: "center", justifyContent: "center" },
  successCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 28,
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#1A1426",
    marginBottom: 8,
  },
  successAmount: {
    fontSize: 40,
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#7C3AED",
    marginBottom: 4,
  },
  successTo: { fontSize: 16, color: "#6B7280", fontFamily: "Inter_400Regular", marginBottom: 4 },
  successDate: { fontSize: 14, color: "#9CA3AF", fontFamily: "Inter_400Regular", marginBottom: 8 },
  successNewBalance: { fontSize: 14, color: "#9CA3AF", fontFamily: "Inter_400Regular", marginBottom: 40 },
  finmyHint: { fontSize: 14, color: "#9CA3AF", fontFamily: "Inter_400Regular", textAlign: "center", marginTop: 24 },
  successDone: {
    backgroundColor: "#7C3AED",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 60,
    marginTop: 16,
  },
  successDoneText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "white" },
});

import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import React, { useState } from "react";
import {
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
import { MOCK_CONTACTS, MOCK_OWN_ACCOUNTS, type Contact, type OwnAccount } from "@/lib/mock-data";

// ─── Types ────────────────────────────────────────────────────────────────────

type TransferType = "local-bank" | "international" | "between-accounts" | "contacts" | "finmy";
type Recurrence = "once" | "weekly" | "monthly" | "yearly";
type Step = "type" | "recipient" | "amount" | "schedule" | "success";

type Recipient =
  | { kind: "contact"; contact: Contact }
  | { kind: "account"; account: OwnAccount }
  | { kind: "bank"; iban: string; name: string; bank: string }
  | { kind: "international"; iban: string; swift: string; bank: string; country: string };

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
  const [step, setStep] = useState<Step>("type");
  const [transferType, setTransferType] = useState<TransferType | null>(null);
  const [scheduled, setScheduled] = useState(false);
  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [scheduleDate, setScheduleDate] = useState(new Date(Date.now() + 86400000));
  const [recurrence, setRecurrence] = useState<Recurrence>("once");
  const [loading, setLoading] = useState(false);

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
    setLoading(true);
    await new Promise((r) => setTimeout(r, 900));
    setLoading(false);
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
      />
    );

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={goBack}>
          <Ionicons name="chevron-back" size={24} color="#EDE0B0" />
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
      {step === "recipient" && (transferType === "contacts" || transferType === "finmy") && (
        <ContactStep
          search={search}
          onSearch={setSearch}
          contacts={filteredContacts}
          label={transferType === "finmy" ? "finmy users" : "Recent"}
          onSelect={(c) => {
            setRecipient({ kind: "contact", contact: c });
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
          <Ionicons name="calendar-outline" size={18} color={scheduled ? "white" : "#C8911A"} />
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
            <Ionicons name={t.icon} size={22} color="#C8911A" />
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

function AccountStep({ onSelect }: { onSelect: (a: OwnAccount) => void }) {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.listLabel}>Your accounts</Text>
      {MOCK_OWN_ACCOUNTS.map((acc) => (
        <TouchableOpacity
          key={acc.id}
          style={styles.accountCard}
          onPress={() => onSelect(acc)}
          activeOpacity={0.7}
        >
          <View style={styles.accountIconWrap}>
            <Ionicons
              name={
                acc.type === "main"
                  ? "card-outline"
                  : acc.type === "savings"
                    ? "wallet-outline"
                    : "trending-up-outline"
              }
              size={20}
              color="#C8911A"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.accountLabel}>{acc.label}</Text>
            <Text style={styles.accountNumber}>{acc.number}</Text>
          </View>
          <Text style={styles.accountBalance}>{acc.balance}</Text>
        </TouchableOpacity>
      ))}
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
  const recipientName =
    recipient?.kind === "contact"
      ? recipient.contact.name
      : recipient?.kind === "account"
        ? recipient.account.label
        : recipient?.kind === "bank"
          ? recipient.name
          : recipient?.kind === "international"
            ? recipient.iban
            : "";

  const valid = !!amount && parseFloat(amount) > 0;

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {recipientName ? (
        <View style={styles.recipientChip}>
          <Ionicons name="person-circle-outline" size={18} color="#C8911A" />
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
          <Ionicons name="calendar-outline" size={14} color="#C8911A" />
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
          accentColor="#C8911A"
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
}: {
  amount: string;
  recipient: Recipient | null;
  scheduled: boolean;
  scheduleDate: Date;
}) {
  const recipientName =
    recipient?.kind === "contact"
      ? recipient.contact.name
      : recipient?.kind === "account"
        ? recipient.account.label
        : recipient?.kind === "bank"
          ? recipient.name
          : recipient?.kind === "international"
            ? recipient.iban
            : "recipient";

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
      <TouchableOpacity style={styles.successDone} onPress={() => router.back()}>
        <Text style={styles.successDoneText}>Done</Text>
      </TouchableOpacity>
    </View>
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
  root: { flex: 1, backgroundColor: "#0D0B07" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: "#1A1610",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerTitle: { fontSize: 17, fontFamily: "PlusJakartaSans_700Bold", color: "#EDE0B0" },
  content: { padding: 20, paddingBottom: 48 },

  // Scheduled toggle
  scheduledToggle: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1610",
    borderRadius: 16,
    padding: 14,
    marginBottom: 24,
    gap: 12,
    borderWidth: 1.5,
    borderColor: "#F3F4F6",
  },
  scheduledToggleOn: { borderColor: "#C8911A", backgroundColor: "#221D12" },
  scheduledToggleIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#221D12",
    alignItems: "center",
    justifyContent: "center",
  },
  scheduledToggleIconOn: { backgroundColor: "#C8911A" },
  scheduledToggleLabel: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#EDE0B0",
    marginBottom: 2,
  },
  scheduledToggleLabelOn: { color: "#C8911A" },
  scheduledToggleSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#6B5E3C" },
  scheduledToggleSubOn: { color: "#C8911A" },
  togglePill: {
    width: 42,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  togglePillOn: { backgroundColor: "#C8911A" },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#1A1610",
    alignSelf: "flex-start",
  },
  toggleThumbOn: { alignSelf: "flex-end" },

  listLabel: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#6B5E3C", marginBottom: 10 },

  // Transfer type cards
  typeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1610",
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
    backgroundColor: "#221D12",
    alignItems: "center",
    justifyContent: "center",
  },
  typeLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#EDE0B0", marginBottom: 2 },
  typeSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#6B5E3C" },

  // Account cards
  accountCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1610",
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
    backgroundColor: "#221D12",
    alignItems: "center",
    justifyContent: "center",
  },
  accountLabel: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#EDE0B0",
    marginBottom: 2,
  },
  accountNumber: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#6B5E3C" },
  accountBalance: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#EDE0B0" },

  // Contact picker
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1610",
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    height: 48,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular", color: "#EDE0B0" },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1610",
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
  contactName: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#EDE0B0", marginBottom: 2 },
  contactHandle: { fontSize: 13, color: "#6B5E3C", fontFamily: "Inter_400Regular" },

  // Amount step
  recipientChip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: 6,
    backgroundColor: "#221D12",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginBottom: 24,
    maxWidth: "80%",
  },
  recipientChipText: { fontSize: 14, fontFamily: "Inter_500Medium", color: "#C8911A" },
  amountWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  currencyPrefix: {
    fontSize: 28,
    fontFamily: "Inter_400Regular",
    color: "#6B5E3C",
    marginRight: 8,
    marginTop: 6,
  },
  amountInput: {
    fontSize: 52,
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#EDE0B0",
    minWidth: 120,
    textAlign: "center",
  },
  quickAmounts: { flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 24 },
  quickChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#221D12",
    borderRadius: 20,
  },
  quickChipText: { fontSize: 13, color: "#C8911A", fontFamily: "Inter_500Medium" },
  noteWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1610",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  noteInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular", color: "#EDE0B0" },
  scheduleHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 24,
    paddingHorizontal: 2,
  },
  scheduleHintText: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#C8911A" },

  // Form fields
  formField: { marginBottom: 16 },
  formLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "#8C7C55",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  formInput: {
    backgroundColor: "#1A1610",
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 50,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: "#EDE0B0",
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },

  // Schedule step
  scheduleLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "#6B5E3C",
    marginBottom: 10,
  },
  datePickerWrap: {
    backgroundColor: "#1A1610",
    borderRadius: 16,
    marginBottom: 24,
    overflow: "hidden",
  },
  recurrenceRow: { flexDirection: "row", gap: 8, marginBottom: 32, flexWrap: "wrap" },
  recurrenceChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#1A1610",
    borderWidth: 1.5,
    borderColor: "#2C2618",
  },
  recurrenceChipOn: { backgroundColor: "#C8911A", borderColor: "#C8911A" },
  recurrenceText: { fontSize: 14, fontFamily: "Inter_500Medium", color: "#8C7C55" },
  recurrenceTextOn: { color: "white" },

  // CTA
  cta: {
    backgroundColor: "#C8911A",
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
    backgroundColor: "#C8911A",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 28,
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#EDE0B0",
    marginBottom: 8,
  },
  successAmount: {
    fontSize: 40,
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#C8911A",
    marginBottom: 4,
  },
  successTo: { fontSize: 16, color: "#8C7C55", fontFamily: "Inter_400Regular", marginBottom: 4 },
  successDate: { fontSize: 14, color: "#6B5E3C", fontFamily: "Inter_400Regular", marginBottom: 40 },
  successDone: {
    backgroundColor: "#C8911A",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 60,
    marginTop: 16,
  },
  successDoneText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "white" },
});

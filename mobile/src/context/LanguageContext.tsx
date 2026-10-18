// TradeFlow Mobile — Language & Localization Context (English & Amharic Support)
import React, { createContext, useContext, useState, ReactNode } from 'react';

export type LanguageCode = 'EN' | 'AM';

export const TRANSLATIONS = {
  EN: {
    // Navigation & Roles
    transporter: 'Transporter',
    driver: 'Driver',
    driver_console: 'Driver Console',
    carrier: 'Carrier',
    console_mode: 'CONSOLE MODE',
    transporter_marketplace: 'Transporter',
    transporter_sub: 'Freight & load marketplace',
    driver_sub: 'Waypoint check-ins & POD',

    // Top Header & Drawer
    tradeflow: 'TradeFlow',
    offline: 'Offline',
    queued: 'queued',
    appearance: 'APPEARANCE',
    dark_mode: 'Dark Mode',
    light_mode: 'Light Mode',
    night_mode_desc: 'Corridor night mode',
    light_mode_desc: 'Daylight high contrast',
    settings: 'SETTINGS',
    notifications: 'Notifications',
    notifications_sub: 'Load bids & waypoints',
    language: 'Language',
    language_current: 'English',
    offline_queue: 'Offline Queue',
    offline_queue_sub: 'Local SQLite storage',
    app_version: 'v1.0.0',
    log_out: 'Log Out',
    log_out_confirm: 'Are you sure you want to log out of TradeFlow?',
    cancel: 'Cancel',

    // Feed Tabs & Filters
    available: 'Available',
    my_bids: 'My Bids',
    search_loads: 'Search loads...',
    all_routes: 'All',
    loading_loads: 'Loading loads...',
    no_loads: 'No cargo loads available',
    no_loads_sub: 'Check back soon for new corridor dispatches.',
    no_active_bids: 'No active bids',
    no_loads_found: 'No loads found',
    my_bids_empty_sub: 'Your placed bids will appear here.',
    filter_empty_sub: 'Try adjusting your corridor route filter or search.',
    // Calendar & Dual Time
    calendar_section: 'CALENDAR & CORRIDOR TIME',
    calendar_ec: 'Ethiopian Calendar (EC / ዓ.ም)',
    calendar_gc: 'Gregorian Calendar (GC / እ.ኤ.አ)',
    pickup_window: 'Pickup Window',
    time_ethiopian: 'Ethiopian Time (12h format)',
    time_gregorian: 'Standard Time (12h AM/PM)',

    // Cargo Card & Specs
    origin: 'Origin',
    destination: 'Destination',
    payload: 'Payload',
    tons: 'tons',
    listed_rate: 'Listed Rate',
    place_bid: 'Place Bid',
    bid_placed: 'Bid Placed',
    bid_submitted: 'Bid Submitted',
    in_transit: 'In Transit',
    delivered: 'Delivered',
    open: 'Open',
    weight: 'Weight',
    corridor_leg: 'Corridor Leg',
    long_haul: 'Long Haul',
    regional: 'Regional',
    urgent_dispatch: 'Urgent Dispatch',
    pickup: 'Pickup',

    // Bid Modal
    bid_modal_title: 'Place Bid',
    route: 'Route',
    adjustment: 'Adjustment',
    bid_amount_etb: 'Bid (ETB)',
    truck_plate: 'Truck Plate',
    availability: 'Availability',
    submit_bid: 'Submit Bid',

    // Driver Screen
    active_trip: 'Active Trip',
    completed_trip: 'Completed',
    truck: 'Truck',
    progress: 'Progress',
    stops: 'Stops',
    report_delay: 'Report Delay',
    proof_of_delivery: 'Proof of Delivery',
    waypoints: 'Waypoints',
    check_in: 'Check In',
    verified: 'Verified',
    describe_delay: 'Describe delay reason...',
    notes: 'Notes',
    submit: 'Submit',
    receiver_name: 'Receiver Name',
    waybill_ref: 'Waybill Reference',
    sign_complete: 'Sign & Complete',
    delivery_confirmed: 'Delivery Confirmed',

    // Incident Types
    incident_fuel: 'Fuel Station Queue',
    incident_roadblock: 'Road Obstruction',
    incident_breakdown: 'Mechanical Issue',
    incident_customs: 'Customs Hold',

    // Offline Queue Modal
    offline_queue_title: 'Offline Queue',
    actions_stored: 'actions stored locally',
    sync: 'Sync',
    close: 'Close',
    online_status: 'Online (Tap to simulate offline)',
    offline_status: 'Offline — saved locally (Tap to reconnect)',
    no_queued_actions: 'No queued actions',
    pending: 'Pending',
    synced: 'Synced',
    failed: 'Failed',
    load_id: 'Load ID',

    // Auth Screen
    sign_in: 'Sign In',
    register: 'Register',
    full_name: 'Full Name',
    company_name: 'Company / Organization Name',
    tin_number: 'TIN Number (10 Digits)',
    fleet_size: 'Fleet Size (Trucks)',
    driver_license: 'Commercial Driver License (CDL)',
    truck_plate_label: 'Truck License Plate',
    phone_number: 'Phone Number',
    phone_or_email: 'Phone or Email',
    email_address: 'Business Email Address',
    continue_with_google: 'Continue with Google',
    or_continue_with_google: 'OR CONTINUE WITH GOOGLE',
    or_continue_with_email: 'OR CONTINUE WITH EMAIL',
    or_continue_with_phone: 'OR CONTINUE WITH PHONE NUMBER',
    password: 'Password',
    confirm_password: 'Confirm Password',
    forgot_password: 'Forgot password?',
    create_account: 'Create Account',
    transporter_role_title: 'Transporter',
    transporter_role_subtitle: 'Fleet & Load Bidding',
    driver_role_title: 'Truck Driver',
    driver_role_subtitle: 'Corridor & Waypoints',
    carrier_portal_badge: 'CARRIER PORTAL',
    driver_portal_badge: 'DRIVER ACCESS',
    transporter_login_hero: 'Sign in to manage your fleet, dispatch trips, and bid on corridor loads.',
    transporter_register_hero: 'Register your carrier organization to start bidding on freight loads across the Addis – Djibouti corridor.',
    driver_login_hero: 'Enter your 10-digit Ethiopian mobile number and password to log your waypoints.',
    driver_register_hero: 'Register your driver profile with your commercial license and vehicle plate to receive load assignments.',
    dont_have_account: "Don't have an account?",
    already_have_account: 'Already have an account?',
    create_one: 'Create one',
    sign_in_here: 'Sign in',
    sign_in_as_transporter: 'Sign In as Transporter',
    sign_in_as_driver: 'Sign In as Driver',
    register_as_transporter: 'Register Transporter Account',
    register_as_driver: 'Register Driver Profile',
    official_contact_phone: 'Official Contact Phone',
    optional_label: '(Optional)',
    carrier_fleet_tab: 'Carrier / Fleet',
    driver_tab: 'Truck Driver',
    section_profile_fleet: 'PROFILE & FLEET DETAILS',
    section_credentials: 'LOGIN CREDENTIALS',
    carrier_login_title: 'Carrier Sign In',
    driver_login_title: 'Driver Sign In',
    carrier_register_title: 'Register Carrier Account',
    driver_register_title: 'Register Driver Profile',
    get_started: 'Get Started',
  },
  AM: {
    // Navigation & Roles
    transporter: 'ትራንስፖርተር',
    driver: 'አሽከርካሪ',
    driver_console: 'የአሽከርካሪ ኮንሶል',
    carrier: 'አጓጓዥ',
    console_mode: 'የስራ መስክ',
    transporter_marketplace: 'የትራንስፖርተር ገበያ',
    transporter_sub: 'ጭነቶችን ይፈልጉ እና ይጫረቱ',
    driver_sub: 'የኬላ መድረሻ እና የርክክብ ማረጋገጫ',

    // Top Header & Drawer
    tradeflow: 'TradeFlow',
    offline: 'ከመስመር ውጭ',
    queued: 'ተራ የያዙ',
    appearance: 'ገጽታ',
    dark_mode: 'ጨለማ ገጽታ',
    light_mode: 'ብርሃን ገጽታ',
    night_mode_desc: 'የምሽት ምቹ እይታ',
    light_mode_desc: 'የቀን ብሩህ እይታ',
    settings: 'ቅንብሮች',
    notifications: 'ማሳወቂያዎች',
    notifications_sub: 'የጭነት ጨረታ እና የጉዞ መረጃ',
    language: 'ቋንቋ',
    language_current: 'አማርኛ',
    offline_queue: 'ከመስመር ውጭ ወረፋ',
    offline_queue_sub: 'በስልክ ላይ የተከማቸ',
    app_version: 'v1.0.0',
    log_out: 'ውጣ',
    log_out_confirm: 'እርግጠኛ ነዎት ከTradeFlow መውጣት ይፈልጋሉ?',
    cancel: 'ሰርዝ',

    // Feed Tabs & Filters
    available: 'የሚገኙ ጭነቶች',
    my_bids: 'የእኔ ጨረታዎች',
    search_loads: 'ጭነቶችን ፈልግ...',
    all_routes: 'ሁሉም',
    loading_loads: 'ጭነቶች በመጫን ላይ...',
    no_loads: 'ምንም ክፍት ጭነት አልተገኘም',
    no_loads_sub: 'አዳዲስ ጭነቶች ሲለቀቁ እዚህ ይገኛሉ።',
    no_active_bids: 'ምንም ንቁ ጨረታ የለም',
    no_loads_found: 'ምንም ክፍት ጭነት አልተገኘም',
    my_bids_empty_sub: 'ያስገቧቸው ጨረታዎች እዚህ ይታያሉ።',
    filter_empty_sub: 'የመስመር ማጣሪያዎን ይቀይሩ።',

    // Calendar & Dual Time
    calendar_section: 'የቀን እና ሰዓት አቆጣጠር (EC / GC)',
    calendar_ec: 'የኢትዮጵያ ቀን አቆጣጠር (EC / ዓ.ም)',
    calendar_gc: 'የፈረንጆች ቀን አቆጣጠር (GC / እ.ኤ.አ)',
    pickup_window: 'የመጫኛ ቀን እና ሰዓት',
    time_ethiopian: 'የኢትዮጵያ 12 ሰዓት (ጠዋት/ከሰዓት/ምሽት/ሌሊት)',
    time_gregorian: 'የፈረንጆች 12hr AM/PM (GC)',

    // Cargo Card & Specs
    origin: 'መነሻ',
    destination: 'መድረሻ',
    payload: 'የጭነት ክብደት',
    tons: 'ቶን',
    listed_rate: 'መነሻ ዋጋ',
    place_bid: 'ጨረታ አስገባ',
    bid_placed: 'ጨረታ ቀርቧል',
    bid_submitted: 'ጨረታ ቀርቧል',
    in_transit: 'በመጓጓዝ ላይ',
    delivered: 'ደርሷል',
    open: 'ክፍት',
    weight: 'ክብደት',
    corridor_leg: 'የጉዞ ክፍል',
    long_haul: 'ረጅም ርቀት',
    regional: 'አካባቢያዊ',
    urgent_dispatch: 'አስቸኳይ ጭነት',
    pickup: 'መጫኛ',

    // Bid Modal
    bid_modal_title: 'ጨረታ አስገባ',
    route: 'መስመር',
    adjustment: 'የዋጋ ማስተካከያ',
    bid_amount_etb: 'የቀረበ ዋጋ (ብር)',
    truck_plate: 'የታርጋ ቁጥር',
    availability: 'ዝግጁነት',
    submit_bid: 'ጨረታውን አረጋግጥ',

    // Driver Screen
    active_trip: 'ንቁ ጉዞ',
    completed_trip: 'የተጠናቀቀ',
    truck: 'መኪና',
    progress: 'ሂደት',
    stops: 'ማቆሚያዎች',
    report_delay: 'መዘግየት ሪፖርት አድርግ',
    proof_of_delivery: 'ርክክብ ማረጋገጫ',
    waypoints: 'መተላለፊያ ኬላዎች',
    check_in: 'ኬላ መድረስ አረጋግጥ',
    verified: 'ተረጋግጧል',
    describe_delay: 'የመዘግየቱን ምክንያት ይግለጹ...',
    notes: 'ተጨማሪ ማብራሪያ',
    submit: 'አስገባ',
    receiver_name: 'የተረካቢ ስም',
    waybill_ref: 'የዌይቢል ቁጥር',
    sign_complete: 'ፈርመህ አጠናቅቅ',
    delivery_confirmed: 'ርክክብ ተረጋግጧል',

    // Incident Types
    incident_fuel: 'የነዳጅ ወረፋ',
    incident_roadblock: 'የመንገድ መዘጋት',
    incident_breakdown: 'የቴክኒክ ብልሽት',
    incident_customs: 'የጉምሩክ ፍተሻ መዘግየት',

    // Offline Queue Modal
    offline_queue_title: 'ከመስመር ውጭ ወረፋ',
    actions_stored: 'ተግባራት በስልክ ላይ ተቀምጠዋል',
    sync: 'አመሳስል',
    close: 'ዝጋ',
    online_status: 'በመስመር ላይ (ከመስመር ውጭ ለመሞከር ንካ)',
    offline_status: 'ከመስመር ውጭ በስልክ ላይ ተቀምጧል (ለመገናኘት ንካ)',
    no_queued_actions: 'ምንም የተያዘ ተግባር የለም',
    pending: 'በመጠባበቅ ላይ',
    synced: 'ተመሳስሏል',
    failed: 'አልተሳካም',
    load_id: 'የጭነት መለያ',

    // Auth Screen
    sign_in: 'ግባ',
    register: 'ተመዝገብ',
    full_name: 'ሙሉ ስም',
    company_name: 'የድርጅት ስም',
    tin_number: 'የግብር ከፋይ ቁጥር (TIN)',
    fleet_size: 'የመኪኖች ብዛት',
    driver_license: 'የመንጃ ፈቃድ ቁጥር',
    truck_plate_label: 'የተሽከርካሪ ሰሌዳ ቁጥር',
    phone_number: 'ስልክ ቁጥር',
    phone_or_email: 'ስልክ ወይም ኢሜይል',
    email_address: 'ኢሜይል አድራሻ',
    continue_with_google: 'በ Google ይቀጥሉ',
    or_continue_with_google: 'ወይም በ Google ይቀጥሉ',
    or_continue_with_email: 'ወይም በኢሜይል ይቀጥሉ',
    or_continue_with_phone: 'ወይም በስልክ ቁጥር ይቀጥሉ',
    password: 'የይለፍ ቃል',
    confirm_password: 'የይለፍ ቃል አረጋግጥ',
    forgot_password: 'የይለፍ ቃል ረሳህ?',
    create_account: 'መለያ ፍጠር',
    transporter_role_title: 'ትራንስፖርተር',
    transporter_role_subtitle: 'የመኪና ፍሊት እና ጨረታ',
    driver_role_title: 'አሽከርካሪ',
    driver_role_subtitle: 'ኮሪደር እና የመንገድ ኬላ',
    carrier_portal_badge: 'የአጓጓዥ መግቢያ',
    driver_portal_badge: 'የአሽከርካሪ መግቢያ',
    transporter_login_hero: 'የተሽከርካሪዎችዎን እንቅስቃሴ ለመቆጣጠር እና በጭነት ጨረታዎች ለመሳተፍ ይግቡ።',
    transporter_register_hero: 'በአዲስ አበባ - ጅቡቲ ኮሪደር ላይ በጭነት ጨረታዎች ለመሳተፍ ድርጅትዎን ይመዝግቡ።',
    driver_login_hero: 'የ 10 አሃዝ ስልክ ቁጥርዎን እና የይለፍ ቃልዎን በማስገባት ጉዞዎን ይጀምሩ።',
    driver_register_hero: 'የጭነት ስራዎችን ለመቀበል የመንጃ ፈቃድዎን እና የተሽከርካሪ ሰሌዳ ቁጥርዎን ያስመዝግቡ።',
    dont_have_account: 'መለያ የለዎትም?',
    already_have_account: 'ቀደም ሲል መለያ አለዎት?',
    create_one: 'አዲስ ይመዝገቡ',
    sign_in_here: 'ይግቡ',
    sign_in_as_transporter: 'በትራንስፖርተርነት ግባ',
    sign_in_as_driver: 'በአሽከርካሪነት ግባ',
    register_as_transporter: 'የትራንስፖርተር መለያ ፍጠር',
    register_as_driver: 'የአሽከርካሪ መለያ ፍጠር',
    official_contact_phone: 'የድርጅቱ ስልክ ቁጥር',
    optional_label: '(አማራጭ)',
    carrier_fleet_tab: 'አጓጓዥ / ፍሊት',
    driver_tab: 'የጭነት አሽከርካሪ',
    section_profile_fleet: 'የመገለጫ እና የተሽከርካሪ መረጃ',
    section_credentials: 'የመለያ መግቢያ መረጃ',
    carrier_login_title: 'የአጓጓዥ መግቢያ',
    driver_login_title: 'የአሽከርካሪ መግቢያ',
    carrier_register_title: 'የትራንስፖርተር መለያ ፍጠር',
    driver_register_title: 'የአሽከርካሪ መለያ ፍጠር',
    get_started: 'ጀምር',
  },
} as const;

export type TranslationKey = keyof typeof TRANSLATIONS.EN;

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  toggleLanguage: () => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'EN',
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (key: TranslationKey) => TRANSLATIONS.EN[key] || (key as string),
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<LanguageCode>('EN');

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'EN' ? 'AM' : 'EN'));
  };

  const t = (key: TranslationKey): string => {
    const langDict = TRANSLATIONS[language] || TRANSLATIONS.EN;
    return langDict[key] || TRANSLATIONS.EN[key] || (key as string);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

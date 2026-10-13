import { supabase } from '@/lib/supabase';
import { getSiteSettings } from '@/data/settings';

export interface Competition {
  slug: string;
  title: string;
  date: string;
  eventDate?: string;
  deadline?: string;
  shortDesc: string;
  fullDesc: string[];
  image: string;
  contentHtml?: string;
  rulesButtonText?: string;
  rulesButtonLink?: string;
  submissionsButtonText?: string;
  submissionsButtonLink?: string;
  customButtons?: { text: string; link: string; color: string }[] | null;
  sidebarWidget?: {
    enabled: boolean;
    title: string;
    value: string;
    buttonText: string;
    buttonLink: string;
  } | null;
  isStarred?: boolean;
  id?: any;
  created_at?: string;
}

export const competitionsData: Competition[] = [
  {
    "slug": "competition-1791826378798",
    "title": "New Competition 2026",
    "date": "December 15, 2026",
    "eventDate": "December 15, 2026",
    "deadline": "December 15, 2026 at 12:00 AM",
    "shortDesc": "Enter a short summary description for the competition cards.",
    "fullDesc": [
      "Overview of the competition guidelines and eligibility requirements."
    ],
    "image": "https://iwjnbreeazxvbzxelnzj.supabase.co/storage/v1/object/public/images/image-1791826399836.webp",
    "contentHtml": "<h1>Competition&nbsp;Guidelines&nbsp;&amp;&nbsp;Rules</h1><p>Start&nbsp;designing&nbsp;your&nbsp;competition&nbsp;page&nbsp;content&nbsp;here&nbsp;using&nbsp;the&nbsp;Word-like&nbsp;ribbon&nbsp;editor!</p>",
    "rulesButtonText": "Download Rules & Regs",
    "rulesButtonLink": "#",
    "submissionsButtonText": "Register / Submissions →",
    "submissionsButtonLink": "#",
    "customButtons": [],
    "sidebarWidget": null,
    "created_at": "2026-10-12T17:33:00.712312+00:00",
    "isStarred": true
  },
  {
    "slug": "All Island Inter School General Knowledge Quiz Competition",
    "title": "<span style=\"font-family: 'Anton', sans-serif; color: #db2777; font-weight: bold\" data-styled=\"true\">ESPERTO’25</span>",
    "date": "October 13, 2026 at 10:00 AM",
    "eventDate": "October 13, 2026 at 10:00 AM",
    "deadline": "October 13, 2026 at 04:00 AM",
    "shortDesc": "<span style=\"font-family: 'Anton', sans-serif\" data-styled=\"true\">The annual inter-house quiz championship.</span>",
    "fullDesc": [
      "The annual inter-house quiz championship that brings together the brightest minds of the college. This is where future champions are discovered.",
      "The Battle of Brains features multiple rounds testing knowledge in Science, Arts, Current Affairs, and Sports."
    ],
    "image": "https://iwjnbreeazxvbzxelnzj.supabase.co/storage/v1/object/public/images/image-1791823349845.webp",
    "contentHtml": "<h3><span style=\"font-family: oswald;\">RULES&nbsp;&amp;&nbsp;REGULATIONS</span></h3><p><span style=\"font-family: oswald;\">&nbsp;</span></p><p><strong style=\"font-family: oswald;\">TEAM&nbsp;COMPOSITION</strong></p><p><span style=\"font-family: oswald;\">&nbsp;</span></p><ul><li><strong style=\"font-family: oswald;\">Maximum&nbsp;of&nbsp;ONE&nbsp;(01)&nbsp;team&nbsp;per&nbsp;school</strong><span style=\"font-family: oswald;\">&nbsp;is&nbsp;allowed&nbsp;to&nbsp;participate&nbsp;in&nbsp;the&nbsp;competition.&nbsp;</span></li><li><span style=\"font-family: oswald;\">Each&nbsp;team&nbsp;will&nbsp;consist&nbsp;of&nbsp;</span><strong style=\"font-family: oswald;\">four&nbsp;(04)&nbsp;members</strong><span style=\"font-family: oswald;\">&nbsp;who&nbsp;are&nbsp;students&nbsp;on&nbsp;the&nbsp;school&nbsp;roll&nbsp;as&nbsp;of&nbsp;31st&nbsp;of&nbsp;December&nbsp;2024.&nbsp;</span></li><li><span style=\"font-family: oswald;\">All&nbsp;the&nbsp;competitors&nbsp;should&nbsp;be&nbsp;born&nbsp;</span><strong style=\"font-family: oswald;\">on&nbsp;or&nbsp;after&nbsp;01.02.2006.</strong></li></ul><p><span style=\"font-family: oswald;\">&nbsp;</span></p><p><strong style=\"font-family: oswald;\">TABLE&nbsp;QUIZ</strong></p><p><span style=\"font-family: oswald;\">&nbsp;</span></p><ul><li><strong style=\"font-family: oswald;\">Registration</strong><span style=\"font-family: oswald;\">&nbsp;of&nbsp;the&nbsp;respective&nbsp;teams&nbsp;will&nbsp;commence&nbsp;at&nbsp;</span><strong style=\"font-family: oswald;\">1.00&nbsp;p.m.</strong><span style=\"font-family: oswald;\">&nbsp;and&nbsp;the&nbsp;</span><strong style=\"font-family: oswald;\">contest</strong><span style=\"font-family: oswald;\">&nbsp;will&nbsp;commence&nbsp;at&nbsp;</span><strong style=\"font-family: oswald;\">1.30&nbsp;p.m.</strong><span style=\"font-family: oswald;\">&nbsp;Teams&nbsp;are&nbsp;kindly&nbsp;requested&nbsp;to&nbsp;</span><strong style=\"font-family: oswald;\">be&nbsp;punctual.</strong><span style=\"font-family: oswald;\">&nbsp;</span></li><li><span style=\"font-family: oswald;\">The&nbsp;quiz&nbsp;will&nbsp;be&nbsp;conducted&nbsp;in&nbsp;both&nbsp;</span><strong style=\"font-family: oswald;\">Sinhala&nbsp;and&nbsp;English</strong><span style=\"font-family: oswald;\">&nbsp;languages.&nbsp;</span></li><li><span style=\"font-family: oswald;\">There&nbsp;will&nbsp;be&nbsp;</span><strong style=\"font-family: oswald;\">five&nbsp;(05)&nbsp;rounds</strong><span style=\"font-family: oswald;\">&nbsp;consisting&nbsp;of&nbsp;</span><strong style=\"font-family: oswald;\">10&nbsp;questions</strong><span style=\"font-family: oswald;\">&nbsp;each,&nbsp;under&nbsp;the&nbsp;following&nbsp;topics.&nbsp;</span></li></ul><p></p><ul><li><ul><li><span style=\"font-family: oswald;\">Round&nbsp;01&nbsp;–&nbsp;Current&nbsp;Affairs&nbsp;</span></li><li><span style=\"font-family: oswald;\">Round&nbsp;02&nbsp;–&nbsp;Arts&nbsp;&amp;&nbsp;Culture&nbsp;</span></li><li><span style=\"font-family: oswald;\">Round&nbsp;03&nbsp;–&nbsp;Science&nbsp;&amp;&nbsp;Technology&nbsp;</span></li><li><span style=\"font-family: oswald;\">Round&nbsp;04&nbsp;–&nbsp;History&nbsp;&amp;&nbsp;Geography&nbsp;</span></li><li><span style=\"font-family: oswald;\">Round&nbsp;05&nbsp;–&nbsp;Sports&nbsp;&amp;&nbsp;Games&nbsp;</span></li></ul></li></ul><p></p><ul><li><span style=\"font-family: oswald;\">A&nbsp;question&nbsp;will&nbsp;be&nbsp;read&nbsp;</span><strong style=\"font-family: oswald;\">only&nbsp;once</strong><span style=\"font-family: oswald;\">.&nbsp;</span></li><li><span style=\"font-family: oswald;\">A&nbsp;</span><strong style=\"font-family: oswald;\">15-second</strong><span style=\"font-family: oswald;\">&nbsp;time&nbsp;interval&nbsp;will&nbsp;be&nbsp;granted&nbsp;for&nbsp;each&nbsp;question&nbsp;during&nbsp;which&nbsp;the&nbsp;team&nbsp;members&nbsp;may&nbsp;discuss&nbsp;and&nbsp;answer.&nbsp;</span></li><li><span style=\"font-family: oswald;\">Answers&nbsp;should&nbsp;be&nbsp;written&nbsp;on&nbsp;the&nbsp;answer&nbsp;sheets&nbsp;provided.&nbsp;</span></li><li><span style=\"font-family: oswald;\">An&nbsp;additional&nbsp;</span><strong style=\"font-family: oswald;\">one&nbsp;minute</strong><span style=\"font-family: oswald;\">&nbsp;will&nbsp;be&nbsp;given&nbsp;after&nbsp;each&nbsp;round&nbsp;to&nbsp;recheck&nbsp;the&nbsp;answers.&nbsp;</span></li><li><span style=\"font-family: oswald;\">Each&nbsp;correct&nbsp;answer&nbsp;will&nbsp;receive&nbsp;</span><strong style=\"font-family: oswald;\">one&nbsp;(01)&nbsp;point,&nbsp;no&nbsp;fractions</strong><span style=\"font-family: oswald;\">&nbsp;of&nbsp;points&nbsp;will&nbsp;be&nbsp;awarded.&nbsp;</span></li><li><span style=\"font-family: oswald;\">At&nbsp;the&nbsp;end&nbsp;of&nbsp;each&nbsp;round,&nbsp;the&nbsp;answer&nbsp;sheets&nbsp;relating&nbsp;to&nbsp;each&nbsp;round&nbsp;should&nbsp;be&nbsp;handed&nbsp;over&nbsp;to&nbsp;the&nbsp;members&nbsp;of&nbsp;the&nbsp;Quiz&nbsp;Club&nbsp;of&nbsp;Nalanda&nbsp;College&nbsp;who&nbsp;would&nbsp;be&nbsp;collecting&nbsp;them.&nbsp;</span></li><li><span style=\"font-family: oswald;\">Each&nbsp;answer&nbsp;sheet&nbsp;should&nbsp;consist&nbsp;of&nbsp;the&nbsp;</span><strong style=\"font-family: oswald;\">Team&nbsp;Name</strong><span style=\"font-family: oswald;\">&nbsp;and&nbsp;the&nbsp;</span><strong style=\"font-family: oswald;\">Round&nbsp;Number</strong><span style=\"font-family: oswald;\">&nbsp;marked.&nbsp;</span></li><li><span style=\"font-family: oswald;\">No&nbsp;contests&nbsp;will&nbsp;be&nbsp;allowed&nbsp;to&nbsp;leave&nbsp;the&nbsp;auditorium&nbsp;or&nbsp;return&nbsp;to&nbsp;his&nbsp;or&nbsp;her&nbsp;seat&nbsp;while&nbsp;the&nbsp;contest&nbsp;in&nbsp;progress.&nbsp;</span></li><li><span style=\"font-family: oswald;\">Phonetically&nbsp;correct&nbsp;answers&nbsp;will&nbsp;be&nbsp;accepted&nbsp;as&nbsp;correct.&nbsp;</span></li><li><span style=\"font-family: oswald;\">Where&nbsp;names&nbsp;are&nbsp;considered,&nbsp;the&nbsp;correct&nbsp;surname&nbsp;of&nbsp;a&nbsp;person&nbsp;will&nbsp;suffice.&nbsp;However,&nbsp;correct&nbsp;surnames&nbsp;with&nbsp;incorrect&nbsp;forenames&nbsp;will&nbsp;not&nbsp;be&nbsp;accepted,&nbsp;and&nbsp;</span><strong style=\"font-family: oswald;\">if&nbsp;it&nbsp;is&nbsp;a&nbsp;famous&nbsp;surname(more&nbsp;than&nbsp;1&nbsp;person)&nbsp;the&nbsp;forename&nbsp;is&nbsp;expected.</strong></li><li><span style=\"font-family: oswald;\">If&nbsp;any&nbsp;contest&nbsp;is&nbsp;found&nbsp;referring&nbsp;any&nbsp;document,&nbsp;book&nbsp;or&nbsp;electronic&nbsp;device&nbsp;during&nbsp;the&nbsp;contest,&nbsp;entire&nbsp;</span><strong style=\"font-family: oswald;\">team&nbsp;will&nbsp;be&nbsp;disqualified.</strong></li></ul><p></p><p><strong style=\"font-family: oswald;\">SPECIAL&nbsp;ROUND</strong></p><p><span style=\"font-family: oswald;\">&nbsp;</span></p><ul><li><span style=\"font-family: oswald;\">In&nbsp;addition&nbsp;to&nbsp;these&nbsp;rounds&nbsp;there&nbsp;will&nbsp;be&nbsp;a&nbsp;</span><strong style=\"font-family: oswald;\">Special&nbsp;Round</strong><span style=\"font-family: oswald;\">&nbsp;which&nbsp;will&nbsp;separate&nbsp;from&nbsp;the&nbsp;main&nbsp;competition,&nbsp;and&nbsp;the&nbsp;winners&nbsp;will&nbsp;be&nbsp;awarded.&nbsp;</span></li><li><span style=\"font-family: oswald;\">The&nbsp;Special&nbsp;Round&nbsp;will&nbsp;focus&nbsp;on&nbsp;the&nbsp;theme&nbsp;</span><strong style=\"font-family: oswald;\">“Batman”</strong><span style=\"font-family: oswald;\">,&nbsp;featuring&nbsp;a&nbsp;total&nbsp;of&nbsp;</span><strong style=\"font-family: oswald;\">10&nbsp;questions</strong><span style=\"font-family: oswald;\">.&nbsp;</span></li></ul><p></p><p><strong style=\"font-family: oswald;\">THE&nbsp;GRAND&nbsp;FINAL</strong></p><p><span style=\"font-family: oswald;\">&nbsp;</span></p><ul><li><span style=\"font-family: oswald;\">The&nbsp;two(02)&nbsp;teams&nbsp;obtaining&nbsp;the&nbsp;highest&nbsp;scores&nbsp;by&nbsp;the&nbsp;end&nbsp;of&nbsp;the&nbsp;main&nbsp;quiz&nbsp;will&nbsp;advance&nbsp;to&nbsp;a&nbsp;separate&nbsp;Grand&nbsp;Final&nbsp;to&nbsp;determine&nbsp;the&nbsp;overall&nbsp;winner.&nbsp;</span></li><li><span style=\"font-family: oswald;\">If&nbsp;there&nbsp;is&nbsp;a&nbsp;tie&nbsp;at&nbsp;the&nbsp;end&nbsp;of&nbsp;the&nbsp;Final&nbsp;quiz&nbsp;a&nbsp;tiebreaker&nbsp;round&nbsp;will&nbsp;be&nbsp;held&nbsp;consisting&nbsp;of&nbsp;</span><strong style=\"font-family: oswald;\">five&nbsp;(05)&nbsp;questions</strong><span style=\"font-family: oswald;\">.&nbsp;If&nbsp;the&nbsp;tie&nbsp;is&nbsp;not&nbsp;resolved&nbsp;tie&nbsp;breakers&nbsp;will&nbsp;continue&nbsp;</span><strong style=\"font-family: oswald;\">till&nbsp;it&nbsp;solved</strong><span style=\"font-family: oswald;\">.&nbsp;</span></li><li><span style=\"font-family: oswald;\">The&nbsp;winners&nbsp;of&nbsp;the&nbsp;Special&nbsp;Round&nbsp;will&nbsp;be&nbsp;awarded&nbsp;separately.&nbsp;</span></li></ul><p><strong style=\"font-family: oswald;\">THE&nbsp;DECISION&nbsp;OF&nbsp;THE&nbsp;JUDGES&nbsp;SHALL&nbsp;BE&nbsp;FINAL&nbsp;IN&nbsp;ANY&nbsp;CIRCUMSTANCES.</strong></p><p><span style=\"font-family: oswald;\">&nbsp;</span></p><p><strong style=\"font-family: oswald;\">OTHER&nbsp;ANNOUNCEMENTS</strong></p><p><span style=\"font-family: oswald;\">&nbsp;</span></p><ul><li><strong style=\"font-family: oswald;\">Refreshments&nbsp;will&nbsp;be&nbsp;provided&nbsp;for&nbsp;all&nbsp;the&nbsp;participating&nbsp;students&nbsp;and&nbsp;teachers.</strong></li><li><strong style=\"font-family: oswald;\">Each&nbsp;team&nbsp;is&nbsp;allowed&nbsp;to&nbsp;be&nbsp;accompanied&nbsp;by&nbsp;only&nbsp;one&nbsp;additional&nbsp;person&nbsp;(either&nbsp;a&nbsp;teacher-in-charge&nbsp;or&nbsp;a&nbsp;parent)&nbsp;apart&nbsp;from&nbsp;the&nbsp;four&nbsp;team&nbsp;members.</strong></li><li><strong style=\"font-family: oswald;\">Access&nbsp;to&nbsp;the&nbsp;school&nbsp;premises&nbsp;during&nbsp;the&nbsp;event&nbsp;will&nbsp;be&nbsp;strictly&nbsp;limited&nbsp;to&nbsp;the&nbsp;quiz&nbsp;team&nbsp;members&nbsp;and&nbsp;teachers;&nbsp;no&nbsp;other&nbsp;individuals&nbsp;will&nbsp;be&nbsp;allowed&nbsp;entry.</strong></li></ul><p></p><p><strong style=\"font-family: oswald;\"><em>For&nbsp;Further&nbsp;Information</em></strong></p><p><span style=\"font-family: oswald;\">&nbsp;</span></p><ul><li><span style=\"font-family: oswald;\">Mrs.&nbsp;Anusha&nbsp;Wijesuriya&nbsp;-&nbsp;Teacher-in-charge&nbsp;of&nbsp;NCQC&nbsp;-&nbsp;</span><strong style=\"font-family: oswald;\">+94&nbsp;71&nbsp;815&nbsp;6881</strong></li><li><span style=\"font-family: oswald;\">Chanul&nbsp;Gamage&nbsp;-&nbsp;President&nbsp;of&nbsp;NCQC&nbsp;-&nbsp;</span><strong style=\"font-family: oswald;\">+94&nbsp;77&nbsp;764&nbsp;5619</strong></li><li><span style=\"font-family: oswald;\">Thivindu&nbsp;Wimalasena&nbsp;–&nbsp;Secretary&nbsp;of&nbsp;NCQC&nbsp;-&nbsp;</span><strong style=\"font-family: oswald;\">+94&nbsp;76&nbsp;445&nbsp;3732</strong></li></ul>",
    "rulesButtonText": "Download Rules & Regs",
    "rulesButtonLink": "https://drive.google.com/file/d/1qPVpgpgO0tMpXxazabMZ1u76yLLmiNs2/view?usp=drivesdk",
    "submissionsButtonText": "BATTLE OF BRAINS 2026 | Submissions →",
    "submissionsButtonLink": "https://drive.google.com/file/d/1qPVpgpgO0tMpXxazabMZ1u76yLLmiNs2/view?usp=drivesdk",
    "customButtons": [
      {
        "link": "https://drive.google.com/file/d/1qPVpgpgO0tMpXxazabMZ1u76yLLmiNs2/view?usp=drivesdk",
        "text": "New Button",
        "color": "#b91c1c"
      }
    ],
    "sidebarWidget": null,
    "created_at": "2026-10-12T17:22:33.854474+00:00",
    "isStarred": true
  }
];

export async function getCompetitionsData(): Promise<Competition[]> {
  const settings = getSiteSettings();
  const starredSlugs = new Set(settings.starredCompetitionSlugs || []);

  try {
    const { data, error } = await supabase
      .from('competition')
      .select('*')
      .neq('slug', '__site_settings__')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      return (data as Competition[]).map(c => ({
        ...c,
        isStarred: starredSlugs.has(c.slug) || (c.isStarred === true)
      }));
    }
  } catch (e) {
    console.error('Supabase fetch error for competitions, using fallback:', e);
  }
  return competitionsData.filter(c => c.slug !== '__site_settings__').map(c => ({
    ...c,
    isStarred: starredSlugs.has(c.slug) || (c.isStarred === true)
  }));
}

export async function getCompetition(slug: string): Promise<Competition | null> {
  if (!slug || slug === '__site_settings__') return null;
  const decoded = decodeURIComponent(slug).trim().toLowerCase();
  const slugified = decoded.replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '');
  const settings = getSiteSettings();
  const starredSlugs = new Set(settings.starredCompetitionSlugs || []);

  try {
    const { data, error } = await supabase
      .from('competition')
      .select('*')
      .neq('slug', '__site_settings__');

    if (!error && data && data.length > 0) {
      const match = (data as Competition[]).find((c) => {
        const cDecoded = decodeURIComponent(c.slug || '').trim().toLowerCase();
        const cSlugified = cDecoded.replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '');
        return cDecoded === decoded || cSlugified === slugified || (c.slug && c.slug.trim() === slug.trim());
      });
      if (match) {
        return {
          ...match,
          isStarred: starredSlugs.has(match.slug) || (match.isStarred === true)
        };
      }
    }
  } catch (e) {
    console.error('Supabase fetch error for competition', slug, e);
  }

  const fallback = competitionsData.find((c) => {
    const cDecoded = decodeURIComponent(c.slug || '').trim().toLowerCase();
    const cSlugified = cDecoded.replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '');
    return cDecoded === decoded || cSlugified === slugified || (c.slug && c.slug.trim() === slug.trim());
  });
  if (!fallback) return null;
  return {
    ...fallback,
    isStarred: starredSlugs.has(fallback.slug) || (fallback.isStarred === true)
  };
}

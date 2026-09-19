/**
 * AHEF Aşı Asistanı - Aşı Verileri ve Algoritma Motoru
 */

const otherRoutineVaccines = [
    { month: 2, name: "BCG", desc: "Verem aşısı. 2. Ay sonu.", code: "bcg", doseInfo: "Tek Doz (1/1)" },
    { month: 2, name: "KPA (1. Doz)", desc: "Konjuge Pnömokok Aşısı. 2. Ay sonu.", code: "kpa_1", doseInfo: "1. Doz / 3" },
    { month: 2, name: "DaBT-İPA-Hib-HepB (1. Doz)", desc: "6'lı Karma aşı (Difteri, Boğmaca, Tetanoz, Polio, Hib, Hepatit B). 2. Ay sonu.", code: "karma_1", doseInfo: "1. Doz / 4" },
    { month: 4, name: "KPA (2. Doz)", desc: "Konjuge Pnömokok Aşısı. 4. Ay sonu.", code: "kpa_2", doseInfo: "2. Doz / 3" },
    { month: 4, name: "DaBT-İPA-Hib-HepB (2. Doz)", desc: "6'lı Karma aşı. 4. Ay sonu.", code: "karma_2", doseInfo: "2. Doz / 4" },
    { month: 6, name: "DaBT-İPA-Hib-HepB (3. Doz)", desc: "6'lı Karma aşı. 6. Ay sonu.", code: "karma_3", doseInfo: "3. Doz / 4" },
    { month: 6, name: "OPA (1. Doz)", desc: "Oral Polio Aşısı (Çocuk Felci). 6. Ay sonu.", code: "opa_1", doseInfo: "1. Doz / 2" },
    { month: 9, name: "KKK (Ek Doz)", desc: "Kızamık, Kızamıkçık, Kabakulak ek dozu. 9. Ay sonu.", code: "kkk_ek", doseInfo: "Ek Doz / 3" },
    { month: 12, name: "KPA (Rapel)", desc: "Konjuge Pnömokok Pekiştirme dozu. 12. Ay sonu.", code: "kpa_rapel", doseInfo: "Rapel (3. Doz / 3)" },
    { month: 12, name: "Suçiçeği (1. Doz)", desc: "Suçiçeği aşısı 1. dozu. 12. Ay sonu.", code: "sucicegi_1", doseInfo: "1. Doz / 2" },
    { month: 12, name: "KKK (1. Doz)", desc: "Kızamık, Kızamıkçık, Kabakulak 1. dozu. 12. Ay sonu.", code: "kkk_1", doseInfo: "1. Doz / 3" },
    { month: 18, name: "DaBT-İPA-Hib-HepB (Rapel)", desc: "6'lı Karma aşı pekiştirme dozu. 18. Ay sonu.", code: "karma_rapel", doseInfo: "Rapel (4. Doz / 4)" },
    { month: 18, name: "OPA (2. Doz)", desc: "Oral Polio Aşısı pekiştirme. 18. Ay sonu.", code: "opa_2", doseInfo: "2. Doz / 2 (Rapel)" },
    { month: 18, name: "Hep-A (1. Doz)", desc: "Hepatit A aşısı başlangıcı. 18. Ay sonu.", code: "hepa_1", doseInfo: "1. Doz / 2" },
    { month: 24, name: "Hep-A (2. Doz)", desc: "Hepatit A aşısı 2. dozu. 24. Ay sonu.", code: "hepa_2", doseInfo: "2. Doz / 2" },
    { month: 48, name: "DaBT-İPA (Rapel)", desc: "4'lü Karma aşı pekiştirme dozu (4 Yaş / 48. Ay).", code: "dabt_ipa_rapel", doseInfo: "Rapel (4 Yaş)" },
    { month: 48, name: "KKK (2. Doz)", desc: "Kızamık, Kızamıkçık, Kabakulak 2. dozu (4 Yaş / 48. Ay).", code: "kkk_2", doseInfo: "2. Doz / 3" },
    { month: 48, name: "Suçiçeği (2. Doz)", desc: "Suçiçeği aşısı 2. pekiştirme dozu (4 Yaş / 48. Ay).", code: "sucicegi_2", doseInfo: "2. Doz / 2" },
    { month: 156, name: "Td (Rapel)", desc: "Erişkin Tipi Difteri-Tetanoz pekiştirme dozu (13 Yaş / 156. Ay).", code: "td_rapel", doseInfo: "Rapel (13 Yaş)" }
];

/**
 * Sağlık Bakanlığı ve Pediatri Kılavuzlarına Göre Doğum Ağırlığı & Anne HBsAg Hepatit B Protokolü (2026 Takvimi):
 * - Monovalan Hepatit B aşısı doğumda (ilk 72 saat, tercihen ilk 24 saat) uygulanır.
 * - Sonraki Hepatit B aşıları 2, 4, 6 ve 18. aylarda 6'lı Karma (DaBT-İPA-Hib-HepB) içinde uygulanır.
 * - Doğum ağırlığı >= 2000g bebeklere doğumda monovalan 1. doz rutin uygulanır.
 * - Anne HBsAg (+) ise: İlk 12 saat içinde aşı + en geç 7 gün içinde HBIG (Hepatit B İmmünglobulini) uygulanır.
 * - Anne HBsAg (+) ve < 2000g ise: İlk 12 saatte aşı + HBIG yapılır. Bu ilk doz seriye sayılmaz; 1. ayda monovalan ek doz yapılır, 2, 4, 6, 18. aylarda 6'lı karma ile devam edilir (Toplam 4+ doz).
 * - Anne HBsAg (-) ve < 2000g ise: Doğumda aşı ertelenir. Bebek 2000g'a ulaştığında veya 1. ayın sonunda 1. doz yapılır, 2. aydan itibaren 6'lı karma ile devam edilir.
 * - Anne HBsAg bilinmiyor ise: >=2000g ilk 12 saatte aşı; <2000g ilk 12 saatte aşı + HBIG uygulanır.
 */
const getHepatitisBVaccines = (birthWeight = 3000, maternalHbsag = 'negatif') => {
    const isLowWeight = birthWeight < 2000;
    const list = [];

    if (maternalHbsag === 'pozitif') {
        if (isLowWeight) {
            // Anne HBsAg (+) ve < 2000g: Doğum Dozu (sayılmaz) + HBIG + 1. Ay Monovalan + Rutin 6'lı Karma
            list.push({
                month: 0,
                name: "Hep-B (Doğum Dozu) + HBIG (İmmünglobulin)",
                desc: "<span class='warning-text'>Anne HBsAg (+) & &lt;2000g:</span> İlk 12 saat içinde Hep-B aşısı ve en geç 7 gün içinde farklı ekstremiteye HBIG uygulanmalıdır. Düşük doğum ağırlığı nedeniyle bu ilk doz rutin seriye SAYILMAZ.",
                dosage: "İlk 12 saat içinde",
                code: "hepb_birth_preterm",
                doseInfo: "Doğum Dozu (0/4) + HBIG",
                isHbsagProtocol: true
            });
            list.push({
                month: 1,
                name: "Hep-B (1. Doz - Monovalan)",
                desc: "Doğum dozundan 1 ay sonra 3 dozluk rutin seri başlatılır (1. Doz). 9-12. aylarda Anti-HBs ve HBsAg serolojik kontrolü önerilir.",
                dosage: "1. ay sonunda",
                code: "hepb_1_preterm",
                doseInfo: "1. Doz / 4",
                isHbsagProtocol: true
            });
        } else {
            // Anne HBsAg (+) ve >= 2000g: Doğumda Hep-B + HBIG, sonraki dozlar 2, 4, 6, 18. ay 6'lı karma ile
            list.push({
                month: 0,
                name: "Hep-B (1. Doz) + HBIG (İmmünglobulin)",
                desc: "<span class='warning-text'>Anne HBsAg (+):</span> Doğumdan sonraki ilk 12 saat içinde Hep-B aşısı ve en geç 7 gün içinde farklı ekstremiteye HBIG uygulanmalıdır. 9-12. aylarda Anti-HBs ve HBsAg kontrolü yapılır.",
                dosage: "İlk 12 saat içinde",
                code: "hepb_1_pos",
                doseInfo: "1. Doz (Monovalan) + HBIG",
                isHbsagProtocol: true
            });
        }
    } else if (maternalHbsag === 'bilinmiyor') {
        if (isLowWeight) {
            // Anne HBsAg Bilinmiyor ve < 2000g:
            list.push({
                month: 0,
                name: "Hep-B (Doğum Dozu) + HBIG [Anne Bilinmiyor / <2000g]",
                desc: "<span class='warning-text'>Anne Durumu Bilinmiyor & &lt;2000g:</span> İlk 12 saatte aşı yapılır. Anne test sonucu 12 saatte çıkmazsa HBIG uygulanır. Doğum dozu seriye sayılmaz.",
                dosage: "İlk 12 saat içinde",
                code: "hepb_birth_unk_preterm",
                doseInfo: "Doğum Dozu (0/4) + HBIG",
                isHbsagProtocol: true
            });
            list.push({
                month: 1,
                name: "Hep-B (1. Doz - Monovalan)",
                desc: "Doğum dozundan 1 ay sonra başlatılan serinin 1. dozu.",
                dosage: "1. ay sonunda",
                code: "hepb_1_unk_preterm",
                doseInfo: "1. Doz / 4",
                isHbsagProtocol: true
            });
        } else {
            // Anne HBsAg Bilinmiyor ve >= 2000g:
            list.push({
                month: 0,
                name: "Hep-B (1. Doz) [Anne Durumu Bilinmiyor]",
                desc: "<span class='warning-text'>Anne HBsAg Bilinmiyor:</span> İlk 12 saat içinde 1. doz aşı uygulanır. Anneden acil HBsAg testi istenir; pozitif çıkarsa en geç 7 gün içinde HBIG yapılır.",
                dosage: "İlk 12 saat içinde",
                code: "hepb_1_unk",
                doseInfo: "1. Doz (Monovalan)",
                isHbsagProtocol: true
            });
        }
    } else {
        // maternalHbsag === 'negatif'
        if (isLowWeight) {
            // Anne HBsAg (-) ve < 2000g: Doğumda aşı ertelenir, 2000g'a ulaştığında veya 1. ay sonunda başlar
            list.push({
                month: 1,
                name: "Hep-B (1. Doz - 2000g / 1. Ay Sonu)",
                desc: "Anne HBsAg (-) ve doğum ağırlığı &lt;2000g: Doğumda aşı uygulanmaz. Bebek 2000 gr'a ulaştığında veya 1. ayın sonunda 1. doz monovalan Hep-B uygulanır.",
                dosage: "2000g olunca veya 1. ay sonunda",
                code: "hepb_1_neg_preterm",
                doseInfo: "1. Doz (Monovalan)",
                isHbsagProtocol: true
            });
        } else {
            // Anne HBsAg (-) ve >= 2000g: Standart Rutin (Sadece Doğumda Monovalan Hep-B)
            list.push({
                month: 0,
                name: "Hep-B (Doğum Dozu / 1. Doz)",
                desc: "Monovalan Hepatit B aşısı. Doğumdan sonra tercihen ilk 24 saatte, en geç 72 saat içinde uygulanmalıdır. (Sonraki Hepatit B dozları 2, 4, 6 ve 18. aylarda 6'lı karma aşı içerisinde uygulanır).",
                dosage: "İlk 24-72 saat içinde",
                code: "hepb_1",
                doseInfo: "1. Doz (Monovalan)"
            });
        }
    }

    return list;
};

const getRoutineVaccines = (birthWeight = 3000, maternalHbsag = 'negatif') => {
    const hepB = getHepatitisBVaccines(birthWeight, maternalHbsag);
    const combined = [...hepB, ...otherRoutineVaccines];
    combined.sort((a, b) => a.month - b.month);
    return combined;
};

const routineVaccines = getRoutineVaccines(3000, 'negatif');

    const getSpecialVaccines = (monthAge, baseDob) => {
        const specials = [];
        const addMonths = (date, m) => {
            const d = new Date(date);
            d.setMonth(d.getMonth() + m);
            return d.toLocaleDateString('tr-TR');
        };

        // ROTAVİRÜS
        if (monthAge <= 7) {
            specials.push({ 
                name: "Rotavirüs Aşısı", 
                desc: "Monovalan veya Pentavalan Rotavirüs aşılaması.", 
                dosage: "Son doz en geç 7. ayda bitmelidir.", 
                icon: "fa-shield-virus",
                month: Math.max(1, monthAge),
                dateRange: `Uygulama Aralığı: ${addMonths(baseDob, 1)} - ${addMonths(baseDob, 7)}`,
                isSpecial: true,
                doseInfo: "2 veya 3 Doz"
            });
        } else {
            specials.push({
                name: "Rotavirüs Aşısı (Süresi Geçti)",
                desc: "Rotavirüs aşısı son dozu <span class='warning-text'>en geç 7. ayda bitmelidir</span>. 7. aydan sonra invajinasyon riski ve resmi kılavuzlar nedeniyle KESİNLİKLE YAPILMAZ.",
                dosage: "7. aydan sonra yapılamaz.",
                icon: "fa-ban",
                month: 7,
                dateRange: "Uygulama Aralığı: 1 - 7. Aylar (Kaçırıldı)",
                isSpecial: true,
                isExpired: true,
                doseInfo: "Süresi Geçti"
            });
        }
        
        // MENİNGOKOK ALGORİTMASI
        if (monthAge >= 2 && monthAge < 6) {
            specials.push({ 
                name: "Meningokok ACWY (4 Serogrup)", 
                desc: "Nimenrix™ (3 Doz+Rapel) veya Menveo™ (2 Doz+Rapel) aşılarından <span class='warning-text'>SADECE BİRİ</span> seçilir.", 
                dosage: "Dozlar arası en az 2 ay olmalıdır.", 
                icon: "fa-brain",
                month: monthAge,
                dateRange: `Başlangıç: ${addMonths(baseDob, 2)}`,
                isSpecial: true,
                doseInfo: "3 Doz + Rapel"
            });
            specials.push({ 
                name: "Meningokok B (1 Serogrup)", 
                desc: "Bexsero. ACWY aşısından bağımsız olarak ayrıca uygulanır.", 
                dosage: "3 Doz + Rapel (En az 2 ay arayla).", 
                icon: "fa-brain",
                month: monthAge,
                dateRange: `1.Doz: ${addMonths(baseDob, 2)} | 2.Doz: ${addMonths(baseDob, 4)} | 3.Doz: ${addMonths(baseDob, 6)}`,
                isSpecial: true,
                doseInfo: "3 Doz + Rapel"
            });
        } else if (monthAge >= 6 && monthAge < 12) {
            specials.push({ 
                name: "Meningokok ACWY (4 Serogrup)", 
                desc: "Nimenrix™ (1 Doz+Rapel) veya Menveo™/Menactra (1 Doz+Rapel) aşılarından <span class='warning-text'>SADECE BİRİ</span> seçilir.", 
                dosage: "Dozlar arası en az 2 ay olmalıdır.", 
                icon: "fa-brain",
                month: monthAge,
                dateRange: `Başlangıç: ${addMonths(baseDob, monthAge)}`,
                isSpecial: true,
                doseInfo: "1 Doz + Rapel"
            });
            specials.push({ 
                name: "Meningokok B (1 Serogrup)", 
                desc: "Bexsero. ACWY aşısından bağımsız olarak ayrıca uygulanır.", 
                dosage: "2 Doz + Rapel (En az 2 ay arayla).", 
                icon: "fa-brain",
                month: monthAge,
                dateRange: `1.Doz: ${addMonths(baseDob, monthAge)} | 2.Doz: ${addMonths(baseDob, monthAge + 2)}`,
                isSpecial: true,
                doseInfo: "2 Doz + Rapel"
            });
        } else if (monthAge >= 12 && monthAge < 24) {
            specials.push({ 
                name: "Meningokok ACWY (4 Serogrup)", 
                desc: "Nimenrix™, Menveo™ veya Menactra aşılarından <span class='warning-text'>SADECE BİRİ</span> seçilir.", 
                dosage: "Tek (1) DOZ uygulanır.", 
                icon: "fa-brain",
                month: monthAge,
                dateRange: `Uygulama: ${addMonths(baseDob, monthAge)}`,
                isSpecial: true,
                doseInfo: "Tek Doz (1/1)"
            });
            specials.push({ 
                name: "Meningokok B (1 Serogrup)", 
                desc: "Bexsero. ACWY aşısından bağımsız olarak ayrıca uygulanır.", 
                dosage: "2 Doz + Rapel (En az 2 ay arayla).", 
                icon: "fa-brain",
                month: monthAge,
                dateRange: `1.Doz: ${addMonths(baseDob, monthAge)} | 2.Doz: ${addMonths(baseDob, monthAge + 2)}`,
                isSpecial: true,
                doseInfo: "2 Doz + Rapel"
            });
        } else if (monthAge >= 24 && monthAge <= 120) {
            specials.push({ 
                name: "Meningokok ACWY (4 Serogrup)", 
                desc: "Nimenrix™, Menveo™, Menactra veya MenQuadfi aşılarından <span class='warning-text'>SADECE BİRİ</span> seçilir.", 
                dosage: "Tek (1) DOZ uygulanır.", 
                icon: "fa-brain",
                month: monthAge,
                dateRange: `Uygulama: ${addMonths(baseDob, monthAge)}`,
                isSpecial: true,
                doseInfo: "Tek Doz (1/1)"
            });
            specials.push({ 
                name: "Meningokok B (1 Serogrup)", 
                desc: "Bexsero. ACWY aşısından bağımsız olarak ayrıca uygulanır.", 
                dosage: "2 DOZ uygulanır (En az 2 ay arayla).", 
                icon: "fa-brain",
                month: monthAge,
                dateRange: `1.Doz: ${addMonths(baseDob, monthAge)} | 2.Doz: ${addMonths(baseDob, monthAge + 2)}`,
                isSpecial: true,
                doseInfo: "Toplam 2 Doz"
            });
        }
        
        // HPV
        if (monthAge >= 108 && monthAge <= 168) {
            specials.push({ 
                name: "HPV Aşıları (9-14 Yaş)", 
                desc: "Kız ve erkek çocuklarına uygulanabilir.", 
                dosage: "6-12 ay arayla 2 DOZ.", 
                icon: "fa-vial",
                month: monthAge,
                dateRange: `1.Doz: ${addMonths(baseDob, monthAge)} | 2.Doz: ${addMonths(baseDob, monthAge + 6)}`,
                isSpecial: true,
                doseInfo: "Toplam 2 Doz"
            });
        } else if (monthAge >= 180) {
            specials.push({ 
                name: "HPV Aşıları (15+ Yaş)", 
                desc: "Kız ve erkek çocuklarına uygulanabilir.", 
                dosage: "6 ay içinde 3 DOZ (0, 2, 6. aylar).", 
                icon: "fa-vial",
                month: monthAge,
                dateRange: `1.Doz: ${addMonths(baseDob, monthAge)} | 2.Doz: ${addMonths(baseDob, monthAge + 2)} | 3.Doz: ${addMonths(baseDob, monthAge + 6)}`,
                isSpecial: true,
                doseInfo: "Toplam 3 Doz"
            });
        }
        return specials;
    };

    /**
     * Sağlık Bakanlığı GBP Kılavuzlarına göre
     * Eksik Aşılı veya Hiç Aşılanmamış Çocuklar için Hızlandırılmış Yakalama (Catch-up) Takvimi
     */
    const calculateCatchUpVaccines = (currentMonth, baseDob, status, includeSpecial, birthWeight = 3000, maternalHbsag = 'negatif') => {
        const catchUpList = [];
        const addMonths = (date, m) => {
            const d = new Date(date);
            d.setMonth(d.getMonth() + m);
            return d.toLocaleDateString('tr-TR');
        };

        // 1. BCG (Verem)
        if (currentMonth < 2) {
            catchUpList.push({
                name: "BCG (Verem)",
                month: 2,
                desc: "2. Ay sonu rutin BCG aşısı.",
                dosage: "Tek Doz (İntradermal)",
                icon: "fa-shield-halved",
                dateRange: `Planlanan Tarih: ${addMonths(baseDob, 2)}`,
                statusType: 'due',
                doseInfo: "Tek Doz (1/1)"
            });
        } else if (currentMonth >= 2 && currentMonth < 72) {
            if (currentMonth <= 3) {
                catchUpList.push({
                    name: "BCG (Verem - Hızlı Telafi)",
                    month: currentMonth,
                    desc: "2. ayda kaçırılan BCG aşısı 3. aya kadar PPD testi gerekmeksizin hemen uygulanabilir.",
                    dosage: "Tek Doz (Hemen Uygulanmalı)",
                    icon: "fa-shield-halved",
                    dateRange: `Uygulama: ${addMonths(baseDob, currentMonth)}`,
                    statusType: 'critical',
                    doseInfo: "Tek Doz (1/1)"
                });
            } else {
                catchUpList.push({
                    name: "BCG (Verem - PPD ile Telafi)",
                    month: currentMonth,
                    desc: "3. aydan büyük çocuklarda BCG öncesi <span class='warning-text'>PPD (Cilt Testi)</span> yapılmalı; sonuç negatifse BCG uygulanmalıdır.",
                    dosage: "PPD Negatifse Tek Doz",
                    icon: "fa-shield-halved",
                    dateRange: `Uygulama: ${addMonths(baseDob, currentMonth)} (PPD Sonrası)`,
                    statusType: 'critical',
                    doseInfo: "Tek Doz (1/1)"
                });
            }
        } else {
            catchUpList.push({
                name: "BCG (Verem - Süresi Geçti)",
                month: 72,
                desc: "6 yaşından (72 ay) sonra daha önce aşılanmamış sağlıklı çocuklarda BCG aşısı rutin olarak önerilmez/yapılmaz.",
                dosage: "6 yaş üstü rutin dışı.",
                icon: "fa-ban",
                dateRange: "Uygulama süresi geçti (>6 Yaş)",
                statusType: 'expired',
                isExpired: true,
                doseInfo: "Süresi Geçti"
            });
        }

        // 2. Karma Aşı (DaBT-İPA-Hib-HepB veya Td-İPA)
        if (currentMonth < 60) {
            catchUpList.push({
                name: "DaBT-İPA-Hib-HepB (1. Telafi Dozu)",
                month: currentMonth,
                desc: "5'li veya 6'lı Karma aşı yakalama şeması başlangıcı.",
                dosage: "Hemen uygulanmalı",
                icon: "fa-syringe",
                dateRange: `1. Doz: ${addMonths(baseDob, currentMonth)}`,
                statusType: 'critical',
                doseInfo: "1. Doz / 4"
            });
            catchUpList.push({
                name: "DaBT-İPA-Hib-HepB (2. Telafi Dozu)",
                month: currentMonth + 1,
                desc: "1. dozdan en az 4 hafta (1 ay) sonra uygulanır.",
                dosage: "1. dozdan 1 ay sonra",
                icon: "fa-syringe",
                dateRange: `2. Doz: ${addMonths(baseDob, currentMonth + 1)}`,
                statusType: 'due',
                doseInfo: "2. Doz / 4"
            });
            catchUpList.push({
                name: "DaBT-İPA-Hib-HepB (3. Telafi Dozu)",
                month: currentMonth + 2,
                desc: "2. dozdan en az 4 hafta (1 ay) sonra uygulanır.",
                dosage: "2. dozdan 1 ay sonra",
                icon: "fa-syringe",
                dateRange: `3. Doz: ${addMonths(baseDob, currentMonth + 2)}`,
                statusType: 'due',
                doseInfo: "3. Doz / 4"
            });
            catchUpList.push({
                name: "DaBT-İPA-Hib (Rapel Doz)",
                month: currentMonth + 14,
                desc: "3. dozdan 12 ay sonra pekiştirme dozu uygulanır.",
                dosage: "3. dozdan 12 ay sonra",
                icon: "fa-syringe",
                dateRange: `Rapel: ${addMonths(baseDob, currentMonth + 14)}`,
                statusType: 'due',
                doseInfo: "4. Doz / 4 (Rapel)"
            });
        } else {
            // >= 5 yaş (60 ay): Hib aşısı yapılmaz
            catchUpList.push({
                name: "Td-İPA / DaBT-İPA (1. Telafi Dozu)",
                month: currentMonth,
                desc: "5 yaşından büyük çocuklarda Hib yapılmaz; Td-İPA / DaBT-İPA uygulanır.",
                dosage: "Hemen uygulanmalı (Hib Hariç)",
                icon: "fa-syringe",
                dateRange: `1. Doz: ${addMonths(baseDob, currentMonth)}`,
                statusType: 'critical',
                doseInfo: "1. Doz / 3"
            });
            catchUpList.push({
                name: "Td-İPA / DaBT-İPA (2. Telafi Dozu)",
                month: currentMonth + 1,
                desc: "1. dozdan en az 4 hafta (1 ay) sonra uygulanır.",
                dosage: "1. dozdan 1 ay sonra",
                icon: "fa-syringe",
                dateRange: `2. Doz: ${addMonths(baseDob, currentMonth + 1)}`,
                statusType: 'due',
                doseInfo: "2. Doz / 3"
            });
            catchUpList.push({
                name: "Td-İPA / DaBT-İPA (3. Telafi Dozu)",
                month: currentMonth + 7,
                desc: "2. dozdan en az 6 ay sonra uygulanır.",
                dosage: "2. dozdan 6 ay sonra",
                icon: "fa-syringe",
                dateRange: `3. Doz: ${addMonths(baseDob, currentMonth + 7)}`,
                statusType: 'due',
                doseInfo: "3. Doz / 3"
            });
        }

        // 3. Hep-B (Hepatit B) - Eğer karma aşı içinde verilmiyorsa veya doğumda özel protokol
        if (currentMonth === 0) {
            const hepBVaccines = getHepatitisBVaccines(birthWeight, maternalHbsag);
            hepBVaccines.forEach(hb => {
                catchUpList.push({
                    ...hb,
                    dateRange: hb.month === 0 ? `Uygulama: Doğumda (İlk Saatler)` : `Planlanan Tarih: ${addMonths(baseDob, hb.month)}`,
                    statusType: hb.month === 0 ? 'critical' : 'due'
                });
            });
        } else if (currentMonth >= 60) {
            catchUpList.push({
                name: "Hep-B (1. Telafi Dozu)",
                month: currentMonth,
                desc: "Hepatit B yakalama şeması başlangıcı.",
                dosage: "Hemen uygulanmalı",
                icon: "fa-syringe",
                dateRange: `1. Doz: ${addMonths(baseDob, currentMonth)}`,
                statusType: 'critical',
                doseInfo: "1. Doz / 3"
            });
            catchUpList.push({
                name: "Hep-B (2. Telafi Dozu)",
                month: currentMonth + 1,
                desc: "1. dozdan en az 1 ay sonra.",
                dosage: "1. dozdan 1 ay sonra",
                icon: "fa-syringe",
                dateRange: `2. Doz: ${addMonths(baseDob, currentMonth + 1)}`,
                statusType: 'due',
                doseInfo: "2. Doz / 3"
            });
            catchUpList.push({
                name: "Hep-B (3. Telafi Dozu)",
                month: currentMonth + 6,
                desc: "1. dozdan 6 ay sonra (2. dozdan en az 5 ay sonra).",
                dosage: "1. dozdan 6 ay sonra",
                icon: "fa-syringe",
                dateRange: `3. Doz: ${addMonths(baseDob, currentMonth + 6)}`,
                statusType: 'due',
                doseInfo: "3. Doz / 3"
            });
        }

        // 4. KPA (Konjuge Pnömokok Aşısı - KPA13)
        if (currentMonth < 7) {
            catchUpList.push({
                name: "KPA (1. Doz)",
                month: Math.max(2, currentMonth),
                desc: "Konjuge Pnömokok primer aşılama başlangıcı.",
                dosage: "En erken 2. ayda",
                icon: "fa-shield-virus",
                dateRange: `1. Doz: ${addMonths(baseDob, Math.max(2, currentMonth))}`,
                statusType: currentMonth >= 2 ? 'critical' : 'due',
                doseInfo: "1. Doz / 3"
            });
            catchUpList.push({
                name: "KPA (2. Doz)",
                month: Math.max(4, currentMonth + 2),
                desc: "1. dozdan en az 4-8 hafta sonra.",
                dosage: "4. ayda",
                icon: "fa-shield-virus",
                dateRange: `2. Doz: ${addMonths(baseDob, Math.max(4, currentMonth + 2))}`,
                statusType: 'due',
                doseInfo: "2. Doz / 3"
            });
            catchUpList.push({
                name: "KPA (Rapel Doz)",
                month: Math.max(12, currentMonth + 4),
                desc: "12. ayda pekiştirme dozu.",
                dosage: "12. ayda",
                icon: "fa-shield-virus",
                dateRange: `Rapel: ${addMonths(baseDob, Math.max(12, currentMonth + 4))}`,
                statusType: 'due',
                doseInfo: "3. Doz / 3 (Rapel)"
            });
        } else if (currentMonth >= 7 && currentMonth <= 11) {
            catchUpList.push({
                name: "KPA (1. Telafi Dozu)",
                month: currentMonth,
                desc: "7-11 ay yakalama şeması 1. dozu.",
                dosage: "Hemen uygulanmalı",
                icon: "fa-shield-virus",
                dateRange: `1. Doz: ${addMonths(baseDob, currentMonth)}`,
                statusType: 'critical',
                doseInfo: "1. Doz / 3"
            });
            catchUpList.push({
                name: "KPA (2. Telafi Dozu)",
                month: currentMonth + 1,
                desc: "1. dozdan en az 4 hafta sonra.",
                dosage: "1. dozdan 1 ay sonra",
                icon: "fa-shield-virus",
                dateRange: `2. Doz: ${addMonths(baseDob, currentMonth + 1)}`,
                statusType: 'due',
                doseInfo: "2. Doz / 3"
            });
            catchUpList.push({
                name: "KPA (Rapel Dozu)",
                month: Math.max(12, currentMonth + 3),
                desc: "12. aydan sonra, son dozdan en az 8 hafta sonra.",
                dosage: "12. aydan sonra rapel",
                icon: "fa-shield-virus",
                dateRange: `Rapel: ${addMonths(baseDob, Math.max(12, currentMonth + 3))}`,
                statusType: 'due',
                doseInfo: "3. Doz / 3 (Rapel)"
            });
        } else if (currentMonth >= 12 && currentMonth < 24) {
            catchUpList.push({
                name: "KPA (1. Telafi Dozu)",
                month: currentMonth,
                desc: "12-24 ay yakalama şeması 1. dozu.",
                dosage: "Hemen uygulanmalı",
                icon: "fa-shield-virus",
                dateRange: `1. Doz: ${addMonths(baseDob, currentMonth)}`,
                statusType: 'critical',
                doseInfo: "1. Doz / 2"
            });
            catchUpList.push({
                name: "KPA (2. Telafi Dozu)",
                month: currentMonth + 2,
                desc: "1. dozdan en az 8 hafta (2 ay) sonra. (Rapel gerekmez).",
                dosage: "1. dozdan 2 ay sonra",
                icon: "fa-shield-virus",
                dateRange: `2. Doz: ${addMonths(baseDob, currentMonth + 2)}`,
                statusType: 'due',
                doseInfo: "2. Doz / 2"
            });
        } else if (currentMonth >= 24 && currentMonth < 60) {
            catchUpList.push({
                name: "KPA (Tek Telafi Dozu)",
                month: currentMonth,
                desc: "24-59 ay arası daha önce aşılanmamış çocuklar için tek doz KPA13 yeterlidir.",
                dosage: "Tek Doz (Hemen Uygulanmalı)",
                icon: "fa-shield-virus",
                dateRange: `Uygulama: ${addMonths(baseDob, currentMonth)}`,
                statusType: 'critical',
                doseInfo: "Tek Doz (1/1)"
            });
        }

        // 5. KKK (Kızamık-Kızamıkçık-Kabakulak)
        if (currentMonth < 9) {
            catchUpList.push({
                name: "KKK (Ek Doz)",
                month: 9,
                desc: "9. Ay ek kızamık dozu.",
                dosage: "9. ayda",
                icon: "fa-shield-virus",
                dateRange: `Ek Doz: ${addMonths(baseDob, 9)}`,
                statusType: 'due',
                doseInfo: "Ek Doz / 3"
            });
            catchUpList.push({
                name: "KKK (1. Doz)",
                month: 12,
                desc: "12. Ay rutin 1. dozu.",
                dosage: "12. ayda",
                icon: "fa-shield-virus",
                dateRange: `1. Doz: ${addMonths(baseDob, 12)}`,
                statusType: 'due',
                doseInfo: "1. Doz / 3"
            });
            catchUpList.push({
                name: "KKK (2. Doz)",
                month: 48,
                desc: "48. Ay rutin 2. dozu.",
                dosage: "48. ayda",
                icon: "fa-shield-virus",
                dateRange: `2. Doz: ${addMonths(baseDob, 48)}`,
                statusType: 'due',
                doseInfo: "2. Doz / 3"
            });
        } else if (currentMonth >= 9 && currentMonth < 12) {
            catchUpList.push({
                name: "KKK (Ek Doz - Telafi)",
                month: currentMonth,
                desc: "9-11 ay ek kızamık dozu hemen uygulanmalıdır.",
                dosage: "Hemen uygulanmalı",
                icon: "fa-shield-virus",
                dateRange: `Ek Doz: ${addMonths(baseDob, currentMonth)}`,
                statusType: 'critical',
                doseInfo: "Ek Doz / 3"
            });
            catchUpList.push({
                name: "KKK (1. Doz)",
                month: 12,
                desc: "12. Ay rutin dozu.",
                dosage: "12. ayda",
                icon: "fa-shield-virus",
                dateRange: `1. Doz: ${addMonths(baseDob, 12)}`,
                statusType: 'due',
                doseInfo: "1. Doz / 3"
            });
            catchUpList.push({
                name: "KKK (2. Doz)",
                month: 48,
                desc: "48. Ay rutin dozu.",
                dosage: "48. ayda",
                icon: "fa-shield-virus",
                dateRange: `2. Doz: ${addMonths(baseDob, 48)}`,
                statusType: 'due',
                doseInfo: "2. Doz / 3"
            });
        } else if (currentMonth >= 12 && currentMonth < 48) {
            catchUpList.push({
                name: "KKK (1. Telafi Dozu)",
                month: currentMonth,
                desc: "1 yaş sonrası kaçırılan 1. doz KKK aşısı hemen uygulanmalıdır.",
                dosage: "Hemen uygulanmalı",
                icon: "fa-shield-virus",
                dateRange: `1. Doz: ${addMonths(baseDob, currentMonth)}`,
                statusType: 'critical',
                doseInfo: "1. Doz / 2"
            });
            catchUpList.push({
                name: "KKK (2. Doz)",
                month: 48,
                desc: "48. Ay rutin 2. dozu (1. dozdan en az 4 hafta sonra).",
                dosage: "48. ayda",
                icon: "fa-shield-virus",
                dateRange: `2. Doz: ${addMonths(baseDob, 48)}`,
                statusType: 'due',
                doseInfo: "2. Doz / 2"
            });
        } else {
            // >= 48 ay
            catchUpList.push({
                name: "KKK (1. Telafi Dozu)",
                month: currentMonth,
                desc: "4 yaş ve üzeri çocuklar için 1. doz KKK aşısı.",
                dosage: "Hemen uygulanmalı",
                icon: "fa-shield-virus",
                dateRange: `1. Doz: ${addMonths(baseDob, currentMonth)}`,
                statusType: 'critical',
                doseInfo: "1. Doz / 2"
            });
            catchUpList.push({
                name: "KKK (2. Telafi Dozu)",
                month: currentMonth + 1,
                desc: "1. dozdan en az 4 hafta (1 ay) sonra 2. doz.",
                dosage: "1. dozdan 1 ay sonra",
                icon: "fa-shield-virus",
                dateRange: `2. Doz: ${addMonths(baseDob, currentMonth + 1)}`,
                statusType: 'due',
                doseInfo: "2. Doz / 2"
            });
        }

        // 6. Suçiçeği (12. Ay ve 48. Ay - Toplam 2 Doz)
        if (currentMonth < 12) {
            catchUpList.push({
                name: "Suçiçeği (1. Doz)",
                month: 12,
                desc: "1 Yaş rutin aşısı.",
                dosage: "12. ayda",
                icon: "fa-shield-virus",
                dateRange: `Planlanan Tarih: ${addMonths(baseDob, 12)}`,
                statusType: 'due',
                doseInfo: "1. Doz / 2"
            });
            catchUpList.push({
                name: "Suçiçeği (2. Doz)",
                month: 48,
                desc: "48. Ay rutin 2. dozu.",
                dosage: "48. ayda",
                icon: "fa-shield-virus",
                dateRange: `2. Doz: ${addMonths(baseDob, 48)}`,
                statusType: 'due',
                doseInfo: "2. Doz / 2"
            });
        } else if (currentMonth >= 12 && currentMonth < 48) {
            catchUpList.push({
                name: "Suçiçeği (1. Telafi Dozu)",
                month: currentMonth,
                desc: "1 yaş sonrası kaçırılan 1. doz suçiçeği aşısı hemen uygulanmalıdır.",
                dosage: "Hemen uygulanmalı",
                icon: "fa-shield-virus",
                dateRange: `1. Doz: ${addMonths(baseDob, currentMonth)}`,
                statusType: 'critical',
                doseInfo: "1. Doz / 2"
            });
            catchUpList.push({
                name: "Suçiçeği (2. Doz)",
                month: 48,
                desc: "48. Ay rutin 2. dozu (1. dozdan en az 4 hafta sonra).",
                dosage: "48. ayda",
                icon: "fa-shield-virus",
                dateRange: `2. Doz: ${addMonths(baseDob, 48)}`,
                statusType: 'due',
                doseInfo: "2. Doz / 2"
            });
        } else {
            // >= 48 ay
            catchUpList.push({
                name: "Suçiçeği (1. Telafi Dozu)",
                month: currentMonth,
                desc: "4 yaş ve üzeri çocuklar için 1. doz suçiçeği aşısı.",
                dosage: "Hemen 1. doz",
                icon: "fa-shield-virus",
                dateRange: `1. Doz: ${addMonths(baseDob, currentMonth)}`,
                statusType: 'critical',
                doseInfo: "1. Doz / 2"
            });
            catchUpList.push({
                name: "Suçiçeği (2. Telafi Dozu)",
                month: currentMonth + 1,
                desc: "1. dozdan en az 4 hafta (1 ay) sonra 2. doz.",
                dosage: "1. dozdan 1 ay sonra",
                icon: "fa-shield-virus",
                dateRange: `2. Doz: ${addMonths(baseDob, currentMonth + 1)}`,
                statusType: 'due',
                doseInfo: "2. Doz / 2"
            });
        }

        // 7. Hep-A (Hepatit A)
        if (currentMonth < 18) {
            catchUpList.push({
                name: "Hep-A (1. Doz)",
                month: 18,
                desc: "18. Ay rutin başlangıcı.",
                dosage: "18. ayda",
                icon: "fa-shield-virus",
                dateRange: `1. Doz: ${addMonths(baseDob, 18)}`,
                statusType: 'due',
                doseInfo: "1. Doz / 2"
            });
            catchUpList.push({
                name: "Hep-A (2. Doz)",
                month: 24,
                desc: "24. Ay rutin 2. dozu.",
                dosage: "24. ayda",
                icon: "fa-shield-virus",
                dateRange: `2. Doz: ${addMonths(baseDob, 24)}`,
                statusType: 'due',
                doseInfo: "2. Doz / 2"
            });
        } else {
            catchUpList.push({
                name: "Hep-A (1. Telafi Dozu)",
                month: currentMonth,
                desc: "18. ay sonrası kaçırılan Hepatit A aşısı.",
                dosage: "Hemen uygulanmalı",
                icon: "fa-shield-virus",
                dateRange: `1. Doz: ${addMonths(baseDob, currentMonth)}`,
                statusType: 'critical',
                doseInfo: "1. Doz / 2"
            });
            catchUpList.push({
                name: "Hep-A (2. Telafi Dozu)",
                month: currentMonth + 6,
                desc: "1. dozdan en az 6 ay sonra 2. doz uygulanır.",
                dosage: "1. dozdan 6 ay sonra",
                icon: "fa-shield-virus",
                dateRange: `2. Doz: ${addMonths(baseDob, currentMonth + 6)}`,
                statusType: 'due',
                doseInfo: "2. Doz / 2"
            });
        }

        // 8. OPA (Oral Polio)
        if (currentMonth >= 6 && currentMonth < 60) {
            catchUpList.push({
                name: "OPA (Oral Polio)",
                month: currentMonth,
                desc: "Çocuk felcine karşı oral canlı aşı pekiştirmesi.",
                dosage: "Hemen 2 damla oral",
                icon: "fa-shield-virus",
                dateRange: `Uygulama: ${addMonths(baseDob, currentMonth)}`,
                statusType: 'critical',
                doseInfo: "Pekiştirme (1/1)"
            });
        }

        // Özel Aşılar
        if (includeSpecial) {
            const specials = getSpecialVaccines(currentMonth, baseDob);
            specials.forEach(s => {
                catchUpList.push({
                    ...s,
                    statusType: s.isExpired ? 'expired' : (s.month === currentMonth ? 'critical' : 'due')
                });
            });
        }

        return catchUpList;
    };

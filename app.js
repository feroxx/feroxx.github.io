/**
 * AHEF Aşı Asistanı - UI, Hesaplama ve PDF Yönetimi
 */

document.addEventListener("DOMContentLoaded", () => {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('dobPicker').setAttribute('max', today);

        document.getElementById('ageType').addEventListener('change', (e) => {
            if (e.target.value === 'dob') {
                document.getElementById('numberInputArea').classList.add('hidden');
                document.getElementById('dobInputArea').classList.remove('hidden');
                document.getElementById('dobModal').classList.add('active');
            } else {
                document.getElementById('numberInputArea').classList.remove('hidden');
                document.getElementById('dobInputArea').classList.add('hidden');
            }
        });

        document.getElementById('openModalBtn').addEventListener('click', () => document.getElementById('dobModal').classList.add('active'));
        document.getElementById('closeModalBtn').addEventListener('click', () => document.getElementById('dobModal').classList.remove('active'));
        
        document.getElementById('confirmDobBtn').addEventListener('click', () => {
            const dateVal = document.getElementById('dobPicker').value;
            if(!dateVal) return alert("Lütfen geçerli bir tarih seçin.");

            const birthDate = new Date(dateVal);
            const today = new Date();
            let months = (today.getFullYear() - birthDate.getFullYear()) * 12 + (today.getMonth() - birthDate.getMonth());
            if (today.getDate() < birthDate.getDate()) months--;
            months = Math.max(0, months);

            document.getElementById('calculatedMonths').value = months;
            document.getElementById('rawDobValue').value = dateVal;
            
            const formattedDate = birthDate.toLocaleDateString('tr-TR');
            document.getElementById('selectedDateString').value = formattedDate;
            
            const btn = document.getElementById('openModalBtn');
            btn.innerHTML = `<i class="fa-solid fa-calendar-check"></i> ${formattedDate} (${months} Aylık)`;
            btn.style.backgroundColor = 'var(--success-bg)';
            btn.style.color = 'var(--success-text)';
            document.getElementById('dobModal').classList.remove('active');
        });

        const weightInput = document.getElementById('birthWeight');
        const weightWarning = document.getElementById('weightWarning');
        const updateWeightWarning = () => {
            const val = parseInt(weightInput?.value) || 0;
            if (val > 0 && val < 2000) {
                weightWarning?.classList.remove('hidden');
            } else {
                weightWarning?.classList.add('hidden');
            }
        };

        if (weightInput) {
            weightInput.addEventListener('input', () => {
                updateWeightWarning();
                calculateVaccines();
            });
            weightInput.addEventListener('change', () => {
                updateWeightWarning();
                calculateVaccines();
            });
        }

        document.querySelectorAll('input[name="maternalHbsag"]').forEach(r => {
            r.addEventListener('change', calculateVaccines);
        });

        document.getElementById('calculateBtn').addEventListener('click', () => {
            calculateVaccines();
            const resultsContainer = document.getElementById('resultsContainer');
            if (resultsContainer) {
                resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
        document.getElementById('vaccineStatus').addEventListener('change', calculateVaccines);
        updateWeightWarning();
        calculateVaccines();
    });

    function calculateVaccines() {
        const ageType = document.getElementById('ageType').value;
        const gender = document.getElementById('gender').value;
        const vaccineStatus = document.getElementById('vaccineStatus').value; // 'tam', 'eksik', 'hic'
        const includeSpecial = document.getElementById('includeSpecial').checked;
        const birthWeight = parseInt(document.getElementById('birthWeight')?.value) || 3000;
        const maternalHbsag = document.querySelector('input[name="maternalHbsag"]:checked')?.value || 'negatif';
        
        let totalMonths = 0;
        let badgeTextPrefix = "";
        let baseDob = new Date();

        if (ageType === 'yas') {
            const val = parseInt(document.getElementById('ageValue').value) || 0;
            totalMonths = val * 12;
            badgeTextPrefix = `${val} Yaş`;
            baseDob.setMonth(baseDob.getMonth() - totalMonths);
        } else if (ageType === 'ay') {
            const val = parseInt(document.getElementById('ageValue').value) || 0;
            totalMonths = val;
            badgeTextPrefix = `${val} Aylık`;
            baseDob.setMonth(baseDob.getMonth() - totalMonths);
        } else if (ageType === 'dob') {
            totalMonths = parseInt(document.getElementById('calculatedMonths').value) || 0;
            const rawDob = document.getElementById('rawDobValue').value;
            if (rawDob) baseDob = new Date(rawDob);
            
            const dobStr = document.getElementById('selectedDateString').value;
            badgeTextPrefix = dobStr ? `D.Tarihi: ${dobStr} (${totalMonths} Ay)` : `${totalMonths} Aylık`;
        }

        let processedVaccines = [];

        if (vaccineStatus === 'eksik' || vaccineStatus === 'hic') {
            // Catch-up / Yakalama Takvimi Algoritması
            processedVaccines = calculateCatchUpVaccines(totalMonths, baseDob, vaccineStatus, includeSpecial, birthWeight, maternalHbsag);
        } else {
            // Tam Aşılı Takvim (1 Aylık Pencere ve Geçmiş vs Gelecek Ayrımı)
            const addMonths = (date, m) => {
                const d = new Date(date);
                d.setMonth(d.getMonth() + m);
                return d.toLocaleDateString('tr-TR');
            };

            const currentRoutineVaccines = getRoutineVaccines(birthWeight, maternalHbsag);

            currentRoutineVaccines.forEach(v => {
                const targetDate = new Date(baseDob);
                targetDate.setMonth(targetDate.getMonth() + v.month);
                
                let statusType = 'past';
                
                if (v.month < totalMonths) {
                    // Geçmişte kalmış aşı
                    // 1 Aylık Yapılabilir Pencere Kuralı:
                    // Eğer currentMonth === vaccineMonth + 1 (yani tam 1 ay geçmişse), bu aşı kritik hemen yapılmalı penceresindedir
                    if (totalMonths === v.month + 1) {
                        statusType = 'critical';
                    } else {
                        statusType = 'past';
                    }
                } else if (v.month === totalMonths) {
                    // Tam o ayda olan aşı -> Kritik / Hemen Yapılmalı
                    statusType = 'critical';
                } else {
                    // Gelecekte yapılacak aşı
                    statusType = 'due';
                }

                processedVaccines.push({
                    ...v,
                    isSpecial: false,
                    statusType: statusType,
                    dateRange: v.month === 0 ? `Planlanan Tarih: Doğumda (İlk Saatler)` : `Planlanan Tarih: ${targetDate.toLocaleDateString('tr-TR')}`
                });
            });

            if (includeSpecial) {
                const specials = getSpecialVaccines(totalMonths, baseDob);
                specials.forEach(s => {
                    let statusType = 'critical';
                    if (s.isExpired) {
                        statusType = 'expired';
                    } else if (s.month < totalMonths) {
                        if (totalMonths === s.month + 1) {
                            statusType = 'critical';
                        } else {
                            statusType = 'past';
                        }
                    } else if (s.month === totalMonths) {
                        statusType = 'critical';
                    } else {
                        statusType = 'due';
                    }
                    processedVaccines.push({
                        ...s,
                        statusType: statusType
                    });
                });
            }
        }
        
        renderResults(processedVaccines, totalMonths, gender, vaccineStatus, badgeTextPrefix, birthWeight, maternalHbsag, baseDob, includeSpecial);
    };

    function renderResults(vaccines, totalMonths, gender, vaccineStatus, badgeTextPrefix, birthWeight = 3000, maternalHbsag = 'negatif', baseDob = new Date(), includeSpecial = true) {
        const container = document.getElementById('resultsContainer');
        
        if (vaccines.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fa-regular fa-calendar-xmark"></i>
                    <h3>Bu Periyotta Aşı Bulunmuyor</h3>
                    <p>Seçilen kriterler için herhangi bir aşı kaydı oluşturulamadı.</p>
                </div>
            `;
            return;
        }

        // Sıralama Önceliği:
        // 1. Kritik / Hemen Yapılmalı (En Üstte)
        // 2. Planlanan / Yapılacak Aşılar (Ortada)
        // 3. Kaçırıldı / Süresi Geçti
        // 4. Geçmişte Yapılmış Aşılar (En Altta)
        const priorityOrder = { 'critical': 1, 'due': 2, 'expired': 3, 'past': 4 };
        vaccines.sort((a, b) => {
            const pA = priorityOrder[a.statusType] || 99;
            const pB = priorityOrder[b.statusType] || 99;
            if (pA !== pB) return pA - pB;
            return (a.month || 0) - (b.month || 0);
        });

        const activeVaccines = vaccines.filter(v => v.statusType !== 'past');
        const pastVaccines = vaccines.filter(v => v.statusType === 'past');

        const genderText = gender === 'kiz' ? 'Kız' : 'Erkek';
        const dateStr = new Date().toLocaleDateString('tr-TR');
        let statusLabel = 'Tam Aşılı';
        if (vaccineStatus === 'eksik') statusLabel = 'Eksik Aşılı (Yakalama Takvimi)';
        let hbsagText = 'HBsAg (-)';
        if (maternalHbsag === 'pozitif') hbsagText = 'HBsAg (+) Pozitif';
        if (maternalHbsag === 'bilinmiyor') hbsagText = 'HBsAg (?) Bilinmiyor';

        const weightText = `${birthWeight}g`;

        container.innerHTML = `
            <div class="results-header">
                <div class="summary-badge">
                    <i class="fa-solid fa-clipboard-user"></i>
                    ${badgeTextPrefix} - ${genderText} Çocuğu (${statusLabel}) | ${weightText} | Anne: ${hbsagText}
                </div>
                <div class="header-actions">
                    <button onclick="downloadPDF()" class="btn-pdf"><i class="fa-solid fa-file-pdf"></i> PDF Olarak İndir</button>
                    <button onclick="downloadAsiKarti()" class="btn-asi-karti"><i class="fa-solid fa-id-card"></i> Hastaya Verilecek Aşı Kartı İndir</button>
                </div>
            </div>
            
            <div id="pdfExportArea">
                <h2 class="pdf-title">Çocukluk Çağı Aşı Takvimi Raporu <br><span style="font-size:0.9rem; color:#64748b;">Oluşturulma: ${dateStr} | Durum: ${statusLabel} | Hasta: ${badgeTextPrefix} ${genderText} (Doğum Kilosu: ${weightText}, Anne ${hbsagText})</span></h2>
                <div class="vaccine-grid" id="vaccineGrid"></div>
            </div>

            <!-- Hastaya Verilecek Aşı Takip Kartı Önizleme ve Yazdırma Alanı -->
            <div class="karti-preview-section">
                <div class="karti-preview-header-bar">
                    <div class="karti-preview-title">
                        <i class="fa-solid fa-id-card"></i>
                        <div>
                            <h3>Hastaya Verilecek Resmi Aşı Takip Kartı</h3>
                            <p>Aşağıda hastaya verilmek üzere hazırlanan resmi aşı kartı formatını inceleyebilir ve PDF olarak indirebilirsiniz.</p>
                        </div>
                    </div>
                    <button onclick="downloadAsiKarti()" class="btn-asi-karti btn-karti-action">
                        <i class="fa-solid fa-file-pdf"></i> Aşı Kartını PDF İndir
                    </button>
                </div>
                <div class="karti-scroll-wrapper" id="kartiScrollWrapper">
                    <div id="asiKartiExportArea"></div>
                </div>
            </div>
        `;

        const gridContainer = document.getElementById('vaccineGrid');

        const renderCard = (vaccine) => {
            let cardModClass = "";
            let statusBadgeHtml = "";
            let iconHtml = "";

            if (vaccine.statusType === 'past') {
                cardModClass = "card-past";
                iconHtml = '<i class="fa-solid fa-circle-check"></i>';
                statusBadgeHtml = '<span class="status-badge badge-past"><i class="fa-solid fa-check"></i> Tamamlandı (Geçmiş Doz)</span>';
            } else if (vaccine.statusType === 'critical') {
                cardModClass = "card-critical";
                iconHtml = '<i class="fa-solid fa-triangle-exclamation"></i>';
                statusBadgeHtml = '<span class="status-badge badge-critical"><i class="fa-solid fa-bolt"></i> Kritik / Hemen Yapılmalı</span>';
            } else if (vaccine.statusType === 'expired') {
                cardModClass = "card-expired";
                iconHtml = '<i class="fa-solid fa-ban"></i>';
                statusBadgeHtml = '<span class="status-badge badge-expired"><i class="fa-solid fa-circle-xmark"></i> Kaçırıldı / Artık Yapılamaz</span>';
            } else {
                // due / future
                cardModClass = "card-due";
                const customIcon = vaccine.icon ? vaccine.icon : "fa-syringe";
                iconHtml = `<i class="fa-solid ${customIcon}"></i>`;
                statusBadgeHtml = '<span class="status-badge badge-due"><i class="fa-regular fa-clock"></i> Planlanan / Yapılacak Aşı</span>';
            }

            if (vaccine.isSpecial && vaccine.statusType !== 'expired') {
                cardModClass += " special-card";
            }

            const dosageHtml = vaccine.dosage ? `<span class="dosage">${vaccine.dosage}</span>` : '';
            const dateHtml = vaccine.dateRange ? `<div class="date-range"><i class="fa-regular fa-calendar-days"></i> ${vaccine.dateRange}</div>` : '';
            const doseBadgeHtml = vaccine.doseInfo ? `<span class="dose-badge"><i class="fa-solid fa-vial"></i> ${vaccine.doseInfo}</span>` : '';
            
            return `
                <div class="vaccine-card ${cardModClass}">
                    <div class="card-header-row">
                        ${statusBadgeHtml}
                        ${doseBadgeHtml}
                    </div>
                    <div class="card-top">
                        <div class="card-icon">${iconHtml}</div>
                        <div class="card-content">
                            <h3>${vaccine.name}</h3>
                            <p>${vaccine.desc}</p>
                            ${dosageHtml}
                        </div>
                    </div>
                    ${dateHtml}
                </div>
            `;
        };

        let html = "";
        if (activeVaccines.length > 0 && pastVaccines.length > 0) {
            html += `<div class="section-divider active-divider"><i class="fa-solid fa-bell"></i> Kritik ve Yapılacak Aşılar (${activeVaccines.length})</div>`;
            activeVaccines.forEach(v => { html += renderCard(v); });
            html += `<div class="section-divider past-divider"><i class="fa-solid fa-clock-rotate-left"></i> Geçmişte Yapılmış Aşılar (${pastVaccines.length})</div>`;
            pastVaccines.forEach(v => { html += renderCard(v); });
        } else {
            vaccines.forEach(v => { html += renderCard(v); });
        }

        gridContainer.innerHTML = html;

        // Aşı Kartı HTML şablonunu oluştur
        renderAsiKarti(baseDob, totalMonths, gender, vaccineStatus, badgeTextPrefix, birthWeight, maternalHbsag, includeSpecial);
    };

    function showLoading(msg) {
        const overlay = document.getElementById('pdfLoadingOverlay');
        const text = document.getElementById('pdfLoadingText');
        if (text && msg) text.textContent = msg;
        if (overlay) overlay.classList.add('active');
    }

    function hideLoading() {
        const overlay = document.getElementById('pdfLoadingOverlay');
        if (overlay) overlay.classList.remove('active');
    }

    function renderAsiKarti(baseDob, totalMonths, gender, vaccineStatus, badgeTextPrefix, birthWeight = 3000, maternalHbsag = 'negatif', includeSpecial = true) {
        const exportArea = document.getElementById('asiKartiExportArea');
        if (!exportArea) return;

        const genderText = gender === 'kiz' ? 'Kız' : 'Erkek';
        const dobStr = baseDob ? baseDob.toLocaleDateString('tr-TR') : '--';
        let hbsagText = 'Negatif (-)';
        if (maternalHbsag === 'pozitif') hbsagText = 'Pozitif (+)';
        if (maternalHbsag === 'bilinmiyor') hbsagText = 'Bilinmiyor (?)';

        const getMonthDateStr = (m) => {
            if (!baseDob) return '..../..../20....';
            const d = new Date(baseDob);
            d.setMonth(d.getMonth() + m);
            const day = String(d.getDate()).padStart(2, '0');
            const mon = String(d.getMonth() + 1).padStart(2, '0');
            const yr = d.getFullYear();
            return `${day}/${mon}/${yr}`;
        };

        const renderDozCell = (active, month) => {
            if (!active) {
                return `<td class="karti-td-shaded"></td>`;
            }
            const dateText = (month !== null && month !== undefined) ? getMonthDateStr(month) : '..../..../20....';
            return `
                <td class="karti-td-white">
                    <div class="karti-cell-box">
                        <div class="karti-cell-date">${dateText}</div>
                    </div>
                </td>
            `;
        };

        const renderTekrarCell = (month) => {
            const nextDate = (month !== null && month !== undefined && month >= totalMonths) ? getMonthDateStr(month) : '..../..../20....';
            return `
                <td class="karti-td-white karti-td-tekrar">
                    <div class="karti-cell-box">
                        <div class="karti-cell-date">${nextDate}</div>
                    </div>
                </td>
            `;
        };

        // 2026 Güncel Ulusal Takvime Göre Doz Hesapları:
        // Monovalan Hepatit B sadece DOĞUMDA (1. Doz) yapılır.
        // Sonraki Hepatit B dozları DaBT-İPA-Hib-HepB (6'lı Karma) içinde 2, 4, 6 ve 18. aylarda verilir.
        let hbBirthMonth = 0;
        let hbHasSecondDoz = false;
        let hbSecondMonth = null;

        if (maternalHbsag === 'negatif') {
            if (birthWeight < 2000) {
                // <2000g ve Anne Negatif: Doğum dozu ertelenir; 2000g olunca veya 1. ay sonunda 1. doz yapılır
                hbBirthMonth = 1;
            } else {
                hbBirthMonth = 0; // Rutin doğum dozu
            }
        } else if (maternalHbsag === 'pozitif') {
            if (birthWeight < 2000) {
                // <2000g ve Anne Pozitif: Doğumda aşı (seriye sayılmaz) + 1. ayda monovalan 1. doz
                hbBirthMonth = 0;
                hbHasSecondDoz = true;
                hbSecondMonth = 1;
            } else {
                hbBirthMonth = 0; // İlk 12 saatte 1. doz + HBIG
            }
        } else {
            // Anne durumu bilinmiyor
            if (birthWeight < 2000) {
                hbBirthMonth = 0;
                hbHasSecondDoz = true;
                hbSecondMonth = 1;
            } else {
                hbBirthMonth = 0;
            }
        }

        const nextHb = hbBirthMonth >= totalMonths ? hbBirthMonth : (hbHasSecondDoz && hbSecondMonth >= totalMonths ? hbSecondMonth : null);
        const nextBcg = 2 >= totalMonths ? 2 : null;
        const nextKarma = 2 >= totalMonths ? 2 : (4 >= totalMonths ? 4 : (6 >= totalMonths ? 6 : (18 >= totalMonths ? 18 : null)));
        const nextKpa = 2 >= totalMonths ? 2 : (4 >= totalMonths ? 4 : (12 >= totalMonths ? 12 : null));
        const nextKkk = 12 >= totalMonths ? 12 : (48 >= totalMonths ? 48 : null);
        const nextOpa = 6 >= totalMonths ? 6 : (18 >= totalMonths ? 18 : null);
        const nextDabtIpa = 48 >= totalMonths ? 48 : null;
        const nextTd = 156 >= totalMonths ? 156 : null;
        const nextSc = 12 >= totalMonths ? 12 : (48 >= totalMonths ? 48 : null);
        const nextHepA = 18 >= totalMonths ? 18 : (24 >= totalMonths ? 24 : null);

        // Özel Aşılar Başlangıç ve Doz Hesaplamaları (Bugünün Tarihine / totalMonths Göre Dinamik Belirleme):
        // 1. Meningokok B (Bexsero)
        let menB1Active = true, menB1Month = null;
        let menB2Active = true, menB2Month = null;
        let menBPActive = true, menBPMonth = null;

        if (totalMonths < 3) {
            menB1Month = 3;
            menB2Month = 5;
            menBPMonth = 13;
        } else if (totalMonths < 12) {
            menB1Month = totalMonths;
            menB2Month = totalMonths + 2;
            menBPMonth = Math.max(totalMonths + 6, 13);
        } else if (totalMonths < 24) {
            menB1Month = totalMonths;
            menB2Month = totalMonths + 2;
            menBPMonth = totalMonths + 12;
        } else {
            menB1Month = totalMonths;
            menB2Month = totalMonths + 2;
            menBPActive = false;
        }

        // 2. Meningokok ACWY
        let menAcwy1Active = true, menAcwy1Month = null;
        let menAcwy2Active = true, menAcwy2Month = null;
        let menAcwyPActive = true, menAcwyPMonth = null;

        if (totalMonths < 3) {
            menAcwy1Month = 3;
            menAcwy2Month = 5;
            menAcwyPMonth = 12;
        } else if (totalMonths < 6) {
            menAcwy1Month = totalMonths;
            menAcwy2Month = totalMonths + 2;
            menAcwyPMonth = Math.max(totalMonths + 6, 12);
        } else if (totalMonths < 12) {
            menAcwy1Month = totalMonths;
            menAcwy2Active = false;
            menAcwyPMonth = Math.max(totalMonths + 2, 12);
        } else {
            menAcwy1Month = totalMonths;
            menAcwy2Active = false;
            menAcwyPActive = false;
        }

        // 3. Rota Virüs
        let rota1Active = true, rota1Month = null;
        let rota2Active = true, rota2Month = null;

        if (totalMonths < 2) {
            rota1Month = 2;
            rota2Month = 4;
        } else if (totalMonths <= 5) {
            rota1Month = totalMonths;
            rota2Month = totalMonths + 2;
        } else if (totalMonths <= 6) {
            rota1Month = totalMonths;
            rota2Month = 7;
        } else {
            rota1Active = false;
            rota2Active = false;
        }

        // 4. HPV
        let hpv1Active = true, hpv1Month = null;
        let hpv2Active = true, hpv2Month = null;

        if (totalMonths < 108) {
            hpv1Month = 108;
            hpv2Month = 114;
        } else {
            hpv1Month = totalMonths;
            hpv2Month = totalMonths + 6;
        }

        // includeSpecial toggle kontrolü:
        const finalMenB1 = includeSpecial && menB1Active ? menB1Month : null;
        const finalMenB2 = includeSpecial && menB2Active ? menB2Month : null;
        const finalMenBP = includeSpecial && menBPActive ? menBPMonth : null;

        const finalMenAcwy1 = includeSpecial && menAcwy1Active ? menAcwy1Month : null;
        const finalMenAcwy2 = includeSpecial && menAcwy2Active ? menAcwy2Month : null;
        const finalMenAcwyP = includeSpecial && menAcwyPActive ? menAcwyPMonth : null;

        const finalRota1 = includeSpecial && rota1Active ? rota1Month : null;
        const finalRota2 = includeSpecial && rota2Active ? rota2Month : null;

        const finalHpv1 = includeSpecial && hpv1Active ? hpv1Month : null;
        const finalHpv2 = includeSpecial && hpv2Active ? hpv2Month : null;

        // Tekrar Geliş Tarihleri (Gelecek sıradaki randevu):
        let nextMenBVal = null;
        if (includeSpecial && menB1Active) {
            if (menB1Month > totalMonths) nextMenBVal = menB1Month;
            else if (menB2Active && menB2Month >= totalMonths) nextMenBVal = menB2Month;
            else if (menBPActive && menBPMonth >= totalMonths) nextMenBVal = menBPMonth;
        }

        let nextMenAcwyVal = null;
        if (includeSpecial && menAcwy1Active) {
            if (menAcwy1Month > totalMonths) nextMenAcwyVal = menAcwy1Month;
            else if (menAcwy2Active && menAcwy2Month >= totalMonths) nextMenAcwyVal = menAcwy2Month;
            else if (menAcwyPActive && menAcwyPMonth >= totalMonths) nextMenAcwyVal = menAcwyPMonth;
        }

        let nextRotaVal = null;
        if (includeSpecial && rota1Active) {
            if (rota1Month > totalMonths) nextRotaVal = rota1Month;
            else if (rota2Active && rota2Month >= totalMonths) nextRotaVal = rota2Month;
        }

        let nextHpvVal = null;
        if (includeSpecial && hpv1Active) {
            if (hpv1Month > totalMonths) nextHpvVal = hpv1Month;
            else if (hpv2Active && hpv2Month >= totalMonths) nextHpvVal = hpv2Month;
        }

        let html = `
        <div class="karti-page">
            <div class="karti-header-section">
                <div class="karti-branding">
                    <img src="data:image/png;base64,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" alt="AHEF" class="karti-logo">
                    <div class="karti-title-group">
                        <div class="karti-sub">AHEF &bull; AİLE HEKİMLİĞİ</div>
                        <div class="karti-main-title">AŞI TAKİP KARTI</div>
                    </div>
                </div>
                <div class="karti-patient-grid">
                    <div class="patient-cell"><span class="lbl">Adı Soyadı:</span> <span class="val dotted">........................................</span></div>
                    <div class="patient-cell"><span class="lbl">T.C. No:</span> <span class="val dotted">........................</span></div>
                    <div class="patient-cell"><span class="lbl">Cinsiyet:</span> <span class="val bold">${genderText}</span></div>
                    <div class="patient-cell"><span class="lbl">Doğum Tarihi:</span> <span class="val bold">${dobStr}</span></div>
                    <div class="patient-cell"><span class="lbl">Doğum Kilosu:</span> <span class="val bold">${birthWeight} g</span></div>
                    <div class="patient-cell"><span class="lbl">Anne HBsAg:</span> <span class="val bold">${hbsagText}</span></div>
                </div>
            </div>

            <table class="karti-table">
                <thead>
                    <tr>
                        <th class="th-asilar">AŞILAR</th>
                        <th class="th-doz">1. DOZ</th>
                        <th class="th-doz">2. DOZ</th>
                        <th class="th-doz">3. DOZ</th>
                        <th class="th-doz">PEKİŞTİRME DOZU</th>
                        <th class="th-tekrar">TEKRAR GELİŞ TARİHİ</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td class="karti-td-name">Hep-B (Hepatit B)</td>
                        ${renderDozCell(true, hbBirthMonth)}
                        ${hbHasSecondDoz ? renderDozCell(true, hbSecondMonth) : renderDozCell(false)}
                        ${renderDozCell(false)}
                        ${renderDozCell(false)}
                        ${renderTekrarCell(nextHb)}
                    </tr>
                    <tr>
                        <td class="karti-td-name">BCG</td>
                        ${renderDozCell(true, 2)}
                        ${renderDozCell(false)}
                        ${renderDozCell(false)}
                        ${renderDozCell(false)}
                        ${renderTekrarCell(nextBcg)}
                    </tr>
                    <tr>
                        <td class="karti-td-name">DaBT-İPA-Hib-HepB</td>
                        ${renderDozCell(true, 2)}
                        ${renderDozCell(true, 4)}
                        ${renderDozCell(true, 6)}
                        ${renderDozCell(true, 18)}
                        ${renderTekrarCell(nextKarma)}
                    </tr>
                    <tr>
                        <td class="karti-td-name">KPA</td>
                        ${renderDozCell(true, 2)}
                        ${renderDozCell(true, 4)}
                        ${renderDozCell(false)}
                        ${renderDozCell(true, 12)}
                        ${renderTekrarCell(nextKpa)}
                    </tr>
                    <tr>
                        <td class="karti-td-name">KKK</td>
                        ${renderDozCell(true, 12)}
                        ${renderDozCell(true, 48)}
                        ${renderDozCell(false)}
                        ${renderDozCell(false)}
                        ${renderTekrarCell(nextKkk)}
                    </tr>
                    <tr>
                        <td class="karti-td-name">OPA</td>
                        ${renderDozCell(true, 6)}
                        ${renderDozCell(true, 18)}
                        ${renderDozCell(false)}
                        ${renderDozCell(false)}
                        ${renderTekrarCell(nextOpa)}
                    </tr>
                    <tr>
                        <td class="karti-td-name">Suçiçeği</td>
                        ${renderDozCell(true, 12)}
                        ${renderDozCell(true, 48)}
                        ${renderDozCell(false)}
                        ${renderDozCell(false)}
                        ${renderTekrarCell(nextSc)}
                    </tr>
                    <tr>
                        <td class="karti-td-name">Hep-A</td>
                        ${renderDozCell(true, 18)}
                        ${renderDozCell(true, 24)}
                        ${renderDozCell(false)}
                        ${renderDozCell(false)}
                        ${renderTekrarCell(nextHepA)}
                    </tr>
                    <tr>
                        <td class="karti-td-name">DaBT-İPA</td>
                        ${renderDozCell(false)}
                        ${renderDozCell(false)}
                        ${renderDozCell(false)}
                        ${renderDozCell(true, 48)}
                        ${renderTekrarCell(nextDabtIpa)}
                    </tr>
                    <tr>
                        <td class="karti-td-name">Td</td>
                        ${renderDozCell(false)}
                        ${renderDozCell(false)}
                        ${renderDozCell(false)}
                        ${renderDozCell(true, 156)}
                        ${renderTekrarCell(nextTd)}
                    </tr>
                    <tr class="karti-section-row">
                        <td colspan="6">ÖZEL AŞILAR</td>
                    </tr>
                    <tr>
                        <td class="karti-td-name">Meningokok B</td>
                        ${renderDozCell(menB1Active, finalMenB1)}
                        ${renderDozCell(menB2Active, finalMenB2)}
                        ${renderDozCell(false)}
                        ${renderDozCell(menBPActive, finalMenBP)}
                        ${renderTekrarCell(nextMenBVal)}
                    </tr>
                    <tr>
                        <td class="karti-td-name">Meningokok ACWY</td>
                        ${renderDozCell(menAcwy1Active, finalMenAcwy1)}
                        ${renderDozCell(menAcwy2Active, finalMenAcwy2)}
                        ${renderDozCell(false)}
                        ${renderDozCell(menAcwyPActive, finalMenAcwyP)}
                        ${renderTekrarCell(nextMenAcwyVal)}
                    </tr>
                    <tr>
                        <td class="karti-td-name">Rota Virüs</td>
                        ${renderDozCell(rota1Active, finalRota1)}
                        ${renderDozCell(rota2Active, finalRota2)}
                        ${renderDozCell(false)}
                        ${renderDozCell(false)}
                        ${renderTekrarCell(nextRotaVal)}
                    </tr>
                    <tr>
                        <td class="karti-td-name">HPV</td>
                        ${renderDozCell(hpv1Active, finalHpv1)}
                        ${renderDozCell(hpv2Active, finalHpv2)}
                        ${renderDozCell(false)}
                        ${renderDozCell(false)}
                        ${renderTekrarCell(nextHpvVal)}
                    </tr>
                </tbody>
            </table>

            <div class="karti-footer-section">
                <span>* Lütfen her aşı randevusuna gelirken bu aşı kartını yanınızda getiriniz.</span>
                <span>AHEF Çocukluk Çağı Aşı Asistanı &bull; AHEF Aşı Takip Kartı</span>
            </div>
        </div>
        `;

        exportArea.innerHTML = html;
    };

    window.downloadPDF = () => {
        const element = document.getElementById('pdfExportArea');
        if (!element) return;

        showLoading("Aşı Takvimi Raporu oluşturuluyor...");

        const title = element.querySelector('.pdf-title');
        if (title) title.style.display = 'block';
        element.classList.add('pdf-mode');

        const opt = {
            margin:       [8, 8, 8, 8],
            filename:     'asi-takvimi-raporu.pdf',
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { 
                scale: 2, 
                useCORS: true, 
                letterRendering: true, 
                scrollY: 0,
                scrollX: 0
            },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        setTimeout(() => {
            html2pdf().set(opt).from(element).toPdf().get('pdf').then((pdf) => {
                const pdfDataUri = pdf.output('datauristring');
                
                // 1. Flutter Uygulama İçi WebView Kontrolü:
                if (window.PdfDownloadChannel && window.PdfDownloadChannel.postMessage) {
                    window.PdfDownloadChannel.postMessage(pdfDataUri);
                } else {
                    // 2. Standart Web Tarayıcısı (Chrome/Safari vb.) Fallback:
                    pdf.save('asi-takvimi-raporu.pdf');
                }

                if (title) title.style.display = 'none';
                element.classList.remove('pdf-mode');
                hideLoading();
            }).catch(err => {
                console.error("PDF oluşturma hatası:", err);
                if (title) title.style.display = 'none';
                element.classList.remove('pdf-mode');
                hideLoading();
                alert("PDF oluşturulurken bir hata oluştu.");
            });
        }, 150);
    };

    window.downloadAsiKarti = () => {
        const element = document.getElementById('asiKartiExportArea');
        if (!element || !element.innerHTML.trim()) {
            alert("Lütfen önce bir doğum tarihi veya yaş seçip 'Sorgula ve Takvim Oluştur' butonuna tıklayınız.");
            return;
        }

        showLoading("Aşı Takip Kartı PDF'i oluşturuluyor...");

        element.classList.add('karti-pdf-mode');

        const opt = {
            margin:       [6, 6, 6, 6],
            filename:     'asi-takip-karti.pdf',
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { 
                scale: 2, 
                useCORS: true, 
                letterRendering: true, 
                scrollY: 0,
                scrollX: 0
            },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' }
        };

        setTimeout(() => {
            html2pdf().set(opt).from(element).toPdf().get('pdf').then((pdf) => {
                const pdfDataUri = pdf.output('datauristring');
                
                // 1. Flutter Uygulama İçi WebView Kontrolü:
                if (window.PdfDownloadChannel && window.PdfDownloadChannel.postMessage) {
                    window.PdfDownloadChannel.postMessage(pdfDataUri);
                } else {
                    // 2. Standart Web Tarayıcısı:
                    pdf.save('asi-takip-karti.pdf');
                }

                element.classList.remove('karti-pdf-mode');
                hideLoading();
            }).catch(err => {
                console.error("Aşı kartı oluşturma hatası:", err);
                element.classList.remove('karti-pdf-mode');
                hideLoading();
                alert("Aşı kartı PDF'i oluşturulurken bir hata oluştu: " + (err.message || err));
            });
        }, 150);
    };



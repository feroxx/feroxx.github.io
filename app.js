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

        document.getElementById('calculateBtn').addEventListener('click', calculateVaccines);
        document.getElementById('vaccineStatus').addEventListener('change', calculateVaccines);
        calculateVaccines();
    });

    const calculateVaccines = () => {
        const ageType = document.getElementById('ageType').value;
        const gender = document.getElementById('gender').value;
        const vaccineStatus = document.getElementById('vaccineStatus').value; // 'tam', 'eksik', 'hic'
        const includeSpecial = document.getElementById('includeSpecial').checked;
        
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
            processedVaccines = calculateCatchUpVaccines(totalMonths, baseDob, vaccineStatus, includeSpecial);
        } else {
            // Tam Aşılı Takvim (1 Aylık Pencere ve Geçmiş vs Gelecek Ayrımı)
            const addMonths = (date, m) => {
                const d = new Date(date);
                d.setMonth(d.getMonth() + m);
                return d.toLocaleDateString('tr-TR');
            };

            routineVaccines.forEach(v => {
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
                    dateRange: `Planlanan Tarih: ${targetDate.toLocaleDateString('tr-TR')}`
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
        
        renderResults(processedVaccines, totalMonths, gender, vaccineStatus, badgeTextPrefix);
    };

    const renderResults = (vaccines, totalMonths, gender, vaccineStatus, badgeTextPrefix) => {
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
        if (vaccineStatus === 'hic') statusLabel = 'Hiç Aşılanmamış (Hızlandırılmış Takvim)';

        container.innerHTML = `
            <div class="results-header">
                <div class="summary-badge">
                    <i class="fa-solid fa-clipboard-user"></i>
                    ${badgeTextPrefix} - ${genderText} Çocuğu (${statusLabel})
                </div>
                <button onclick="downloadPDF()" class="btn-pdf"><i class="fa-solid fa-file-pdf"></i> PDF Olarak İndir</button>
            </div>
            
            <div id="pdfExportArea">
                <h2 class="pdf-title">Çocukluk Çağı Aşı Takvimi Raporu <br><span style="font-size:0.9rem; color:#64748b;">Oluşturulma: ${dateStr} | Durum: ${statusLabel} | Hasta: ${badgeTextPrefix} ${genderText}</span></h2>
                <div class="vaccine-grid" id="vaccineGrid"></div>
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
    };

window.downloadPDF = () => {
    const element = document.getElementById('pdfExportArea');
    if (!element) return;

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

    // PDF çıktısını al
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
    }).catch(err => {
        console.error("PDF oluşturma hatası:", err);
        if (title) title.style.display = 'none';
        element.classList.remove('pdf-mode');
    });
};

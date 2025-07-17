// آدرس سرور Flask شما
const FLASK_BACKEND_URL = 'http://127.0.0.1:5000'; 

document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('searchCreateBtn').addEventListener('click', handleCreateCandidate);
    document.getElementById('uploadResumeBtn').addEventListener('click', () => handleFileUpload('resume'));
    document.getElementById('uploadInitialInterviewBtn').addEventListener('click', () => handleFileUpload('initialInterviewForm'));
    document.getElementById('saveNotesStatusBtn').addEventListener('click', saveNotes); // وضعیت حذف شده، فقط یادداشت‌ها
}

// این تابع نام کاندیدا را نمایش می‌دهد و سپس رزومه را به Flask می‌فرستد
async function handleCreateCandidate() {
    const candidateName = document.getElementById('candidateNameInput').value.trim();
    if (!candidateName) {
        alert('لطفاً نام متقاضی را وارد کنید.');
        return;
    }

    // نمایش بخش جزئیات کاندیدا و نام
    document.getElementById('candidateDetailsName').textContent = `اطلاعات کاندیدا: ${candidateName}`;
    document.getElementById('candidateDetails').classList.remove('hidden');

    // فعلاً فقط نام را نمایش می‌دهیم. آپلود رزومه با دکمه جداگانه انجام می‌شود.
    // بعداً می‌توانیم لاجیک را طوری تغییر دهیم که بعد از ایجاد کاندیدا، فرم آپلود رزومه فعال شود.
}

// این تابع فایل را به سرور Flask می‌فرستد
async function handleFileUpload(type) {
    if (type !== 'resume') { // فعلاً فقط آپلود رزومه را پیاده‌سازی می‌کنیم
        alert('این قابلیت (آپلود فرم مصاحبه) در حال حاضر فعال نیست. فقط رزومه آپلود می‌شود.');
        return;
    }

    const fileInput = document.getElementById('resumeUploadInput');
    const statusElement = document.getElementById('resumeUploadStatus');
    const downloadLinkElement = document.getElementById('downloadResumeLink');
    const file = fileInput.files[0];
    const candidateName = document.getElementById('candidateNameInput').value.trim();

    if (!candidateName) {
        alert('لطفاً ابتدا نام کاندیدا را وارد کرده و دکمه "ایجاد کاندیدا" را بزنید.');
        return;
    }

    if (!file) {
        alert('لطفاً یک فایل رزومه انتخاب کنید.');
        return;
    }

    statusElement.textContent = 'در حال آپلود و تحلیل... لطفا صبر کنید.';
    statusElement.style.color = 'blue';

    // ایجاد فرم‌دیتا برای ارسال فایل و نام به Flask
    const formData = new FormData();
    formData.append('resume', file);
    formData.append('candidate_name', candidateName);

    try {
        const response = await fetch(`${FLASK_BACKEND_URL}/upload_and_analyze`, {
            method: 'POST',
            body: formData // Flask می‌تواند FormData را مستقیماً دریافت کند
        });

        const result = await response.json();

        if (result.status === 'success') {
            statusElement.textContent = 'رزومه با موفقیت آپلود و تحلیل شد.';
            statusElement.style.color = 'green';

            // نمایش نتایج تحلیل AI
            const aiAnalysis = result.aiAnalysis;
            if (aiAnalysis && typeof aiAnalysis === 'object') {
                document.getElementById('aiResumeSummaryHeadline').textContent = aiAnalysis.concise_summary_for_interviewer?.headline || 'خلاصه موجود نیست.';

                const keyTakeawaysList = document.getElementById('aiResumeSummaryKeyTakeaways');
                keyTakeawaysList.innerHTML = '';
                if (aiAnalysis.concise_summary_for_interviewer?.key_takeaways && Array.isArray(aiAnalysis.concise_summary_for_interviewer.key_takeaways)) {
                    aiAnalysis.concise_summary_for_interviewer.key_takeaways.forEach(item => {
                        const li = document.createElement('li');
                        li.textContent = item;
                        keyTakeawaysList.appendChild(li);
                    });
                } else {
                    keyTakeawaysList.innerHTML = '<li>نکات کلیدی موجود نیستند.</li>';
                }

                document.getElementById('aiOverallFitScore').textContent = aiAnalysis.full_descriptive_analysis?.overall_fit_score || 'N/A';
                document.getElementById('aiGoToInterview').textContent = aiAnalysis.concise_summary_for_interviewer?.go_to_interview || 'N/A';
                document.getElementById('aiResumeAnalysisFull').textContent = aiAnalysis.full_descriptive_analysis?.core_pm_skills_assessment || aiAnalysis.full_descriptive_analysis?.potential_assessment || 'تحلیل کامل موجود نیست.';

                // برای نمایش فایل رزومه آپلود شده در سایت (اگر از Flask دریافت کنیم)
                // فعلاً فقط لینک موقت مرورگر را نمایش می‌دهیم.
                if (fileInput.files.length > 0) {
                    downloadLinkElement.href = URL.createObjectURL(fileInput.files[0]);
                    downloadLinkElement.textContent = `مشاهده رزومه '${fileInput.files[0].name}'`;
                    downloadLinkElement.classList.remove('hidden');
                }
            } else {
                document.getElementById('aiResumeSummaryHeadline').textContent = 'تحلیل AI نامعتبر/خالی است.';
                document.getElementById('aiResumeSummaryHeadline').style.color = 'red';
            }

        } else {
            statusElement.textContent = `خطا در تحلیل: ${result.message}`;
            statusElement.style.color = 'red';
            alert(`خطا: ${result.message}`);
        }

    } catch (error) {
        statusElement.textContent = `خطا در ارتباط با سرور: ${error.message}`;
        statusElement.style.color = 'red';
        console.error('Error during fetch:', error);
        alert('خطا در ارتباط با سرور. لطفاً کنسول مرورگر را بررسی کنید.');
    }
}

// این تابع فعلاً فقط یک پیام نمایش می‌دهد
function saveNotes() {
    const notes = document.getElementById('interviewerNotes').value;
    alert(`یادداشت‌ها: "${notes}" ذخیره شدند. (این عملیات فعلاً فقط در مرورگر انجام شد، ذخیره نهایی در مراحل بعدی به بک‌اند وصل خواهد شد)`);
}
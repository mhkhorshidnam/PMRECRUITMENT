document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
});

function setupEventListeners() {
    // رویداد کلیک برای دکمه "مشاهده / ایجاد کاندیدا"
    document.getElementById('searchCreateBtn').addEventListener('click', displayCandidateSection);

    // رویداد کلیک برای دکمه "آپلود رزومه"
    document.getElementById('uploadResumeBtn').addEventListener('click', () => handleFileUpload('resume'));

    // رویداد کلیک برای دکمه "آپلود فرم مصاحبه اولیه"
    document.getElementById('uploadInitialInterviewBtn').addEventListener('click', () => handleFileUpload('initialInterviewForm'));

    // رویداد کلیک برای دکمه "ذخیره یادداشت‌ها و وضعیت"
    document.getElementById('saveNotesStatusBtn').addEventListener('click', saveNotesAndStatus);
}

// این تابع فقط بخش جزئیات کاندیدا را نمایش می‌دهد و نام را به‌روز می‌کند
function displayCandidateSection() {
    const candidateName = document.getElementById('candidateNameInput').value.trim();
    if (!candidateName) {
        alert('لطفاً نام متقاضی را وارد کنید.');
        return;
    }

    document.getElementById('candidateDetailsName').textContent = `اطلاعات کاندیدا: ${candidateName}`;
    document.getElementById('candidateDetails').classList.remove('hidden');

    // در این مرحله، سایر فیلدها با مقادیر Placeholder خود نمایش داده می‌شوند.
    // اتصال واقعی به Airtable و هوش مصنوعی در مراحل بعدی انجام خواهد شد.
}

// این تابع فقط فایل‌های آپلود شده را نمایش می‌دهد و هنوز آن‌ها را به بک‌اند نمی‌فرستد
function handleFileUpload(type) {
    let fileInputId = '';
    let statusElementId = '';
    let downloadLinkElementId = '';

    if (type === 'resume') {
        fileInputId = 'resumeUploadInput';
        statusElementId = 'resumeUploadStatus';
        downloadLinkElementId = 'downloadResumeLink';
    } else if (type === 'initialInterviewForm') {
        fileInputId = 'initialInterviewFormUploadInput';
        statusElementId = 'initialInterviewUploadStatus';
        downloadLinkElementId = 'downloadInitialInterviewFormLink';
    }

    const fileInput = document.getElementById(fileInputId);
    const statusElement = document.getElementById(statusElementId);
    const downloadLinkElement = document.getElementById(downloadLinkElementId);
    const file = fileInput.files[0];

    if (!file) {
        alert('لطفاً یک فایل انتخاب کنید.');
        return;
    }

    statusElement.textContent = 'فایل در حال انتخاب...'; // پیام موقت

    // ایجاد URL موقت برای نمایش فایل در مرورگر
    const fileUrl = URL.createObjectURL(file);

    downloadLinkElement.href = fileUrl;
    downloadLinkElement.textContent = `فایل '${file.name}' برای آپلود آماده است.`;
    downloadLinkElement.classList.remove('hidden');

    statusElement.textContent = 'فایل انتخاب شد. (بعداً توسط سیستم پردازش می‌شود)';
    alert(`فایل '${file.name}' انتخاب شد. (بعداً توسط N8N پردازش خواهد شد)`);
}

// این تابع فعلاً هیچ عملیاتی روی بک‌اند انجام نمی‌دهد و فقط یک پیام نمایش می‌دهد
function saveNotesAndStatus() {
    const notes = document.getElementById('interviewerNotes').value;
    // const status = document.getElementById('candidateStatusSelect').value; // این خط حذف شد
    alert(`یادداشت‌ها: "${notes}" ذخیره شدند. (این عملیات فعلاً فقط در مرورگر انجام شد، ذخیره نهایی در مراحل بعدی به بک‌اند وصل خواهد شد)`);
    // در مراحل بعدی، اینجا کد اتصال به بک‌اند برای ذخیره نهایی اضافه می‌شود
}
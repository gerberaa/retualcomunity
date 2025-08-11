document.addEventListener('DOMContentLoaded', () => {
    const worksList = document.getElementById('works-list');
    const worksStats = document.getElementById('works-stats');
    const statusFilter = document.getElementById('status-filter');
    const sortBy = document.getElementById('sort-by');
    const searchInput = document.getElementById('search-input');
    const pagination = document.getElementById('pagination');
    
    let allWorks = [];
    let filteredWorks = [];
    let currentPage = 1;
    const itemsPerPage = 6;

    const fetchWorks = async () => {
        try {
            const response = await fetch('/api/works');
            if (!response.ok) {
                throw new Error('Failed to fetch works');
            }
            allWorks = await response.json();
            applyFiltersAndSort();
        } catch (error) {
            console.error('Error fetching works:', error);
            worksList.innerHTML = '<p style="color: red;">Failed to load works. Make sure the server is running.</p>';
        }
    };
    
    const updateStats = () => {
        const pending = allWorks.filter(w => w.status === 'pending').length;
        const approved = allWorks.filter(w => w.status === 'approved').length;
        const rejected = allWorks.filter(w => w.status === 'rejected').length;
        worksStats.innerHTML = `Total: ${allWorks.length} | Pending: ${pending} | Approved: ${approved} | Rejected: ${rejected}`;
    };
    
    const applyFiltersAndSort = () => {
        let works = [...allWorks];
        
        // Apply status filter
        const statusValue = statusFilter.value;
        if (statusValue !== 'all') {
            works = works.filter(work => work.status === statusValue);
        }
        
        // Apply search filter
        const searchValue = searchInput.value.toLowerCase().trim();
        if (searchValue) {
            works = works.filter(work => 
                (work.title || '').toLowerCase().includes(searchValue) ||
                (work.description || '').toLowerCase().includes(searchValue)
            );
        }
        
        // Apply sorting
        const sortValue = sortBy.value;
        works.sort((a, b) => {
            switch (sortValue) {
                case 'date-desc':
                    return new Date(b.submittedAt) - new Date(a.submittedAt);
                case 'date-asc':
                    return new Date(a.submittedAt) - new Date(b.submittedAt);
                case 'title-asc':
                    return (a.title || '').localeCompare(b.title || '');
                case 'title-desc':
                    return (b.title || '').localeCompare(a.title || '');
                case 'status':
                    const statusOrder = { 'pending': 0, 'approved': 1, 'rejected': 2 };
                    return statusOrder[a.status] - statusOrder[b.status];
                default:
                    return 0;
            }
        });
        
        filteredWorks = works;
        currentPage = 1;
        renderWorks();
        renderPagination();
        updateStats();
    };

    const renderWorks = () => {
        if (filteredWorks.length === 0) {
            worksList.innerHTML = '<p>No works match your criteria.</p>';
            return;
        }
        
        // Paginate works
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedWorks = filteredWorks.slice(startIndex, endIndex);
        
        worksList.innerHTML = '';
        paginatedWorks.forEach(work => {
            const workElement = document.createElement('div');
            workElement.className = 'work-item';
            workElement.innerHTML = `
                <img src="${work.imageUrl}" alt="${work.title}" onerror="this.src='images/placeholder.jpg'">
                <div class="work-info">
                    <h3>${work.title || 'Untitled'}</h3>
                    <p>${work.description || 'No description'}</p>
                    <small>Uploaded: ${new Date(work.submittedAt).toLocaleString()}</small>
                    <p>Status: <span class="status status-${work.status}">${getStatusText(work.status)}</span></p>
                    ${work.addedBy === 'admin' ? '<p><small>✨ Added by administrator</small></p>' : ''}
                </div>
                <div class="work-actions">
                    ${work.status === 'pending' ? `
                        <button class="approve-btn" data-id="${work.id}">Approve</button>
                        <button class="reject-btn" data-id="${work.id}">Reject</button>
                    ` : ''}
                    <button class="delete-btn" data-id="${work.id}" title="Delete work">Delete</button>
                </div>
            `;
            worksList.appendChild(workElement);
        });
    };
    
    const getStatusText = (status) => {
        const statusTexts = {
            'pending': 'Pending',
            'approved': 'Approved',
            'rejected': 'Rejected'
        };
        return statusTexts[status] || status;
    };
    
    const renderPagination = () => {
        const totalPages = Math.ceil(filteredWorks.length / itemsPerPage);
        
        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }
        
        let paginationHTML = '';
        
        // Previous button
        paginationHTML += `<button ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">Previous</button>`;
        
        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === currentPage || i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
                paginationHTML += `<button class="${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
            } else if (i === currentPage - 2 || i === currentPage + 2) {
                paginationHTML += '<span>...</span>';
            }
        }
        
        // Next button
        paginationHTML += `<button ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">Next</button>`;
        
        // Page info
        paginationHTML += `<span class="page-info">Page ${currentPage} of ${totalPages}</span>`;
        
        pagination.innerHTML = paginationHTML;
    };
    
    // Make changePage function global
    window.changePage = (page) => {
        currentPage = page;
        renderWorks();
        renderPagination();
    };

    const updateStatus = async (id, status) => {
        try {
            const response = await fetch(`/api/works/${id}/status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status }),
            });

            if (!response.ok) {
                throw new Error('Failed to update status');
            }
            fetchWorks(); // Refresh the list
        } catch (error) {
            console.error(`Error updating status for work ${id}:`, error);
            alert('Failed to update status.');
        }
    };

    worksList.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        if (!id) return;

        if (e.target.classList.contains('approve-btn')) {
            updateStatus(id, 'approved');
        }
        if (e.target.classList.contains('reject-btn')) {
            updateStatus(id, 'rejected');
        }
        if (e.target.classList.contains('delete-btn')) {
            deleteWork(id);
        }
    });
    
    const deleteWork = async (id) => {
        const work = allWorks.find(w => w.id == id);
        const workTitle = work ? work.title || 'Untitled' : 'work';
        
        if (!confirm(`Are you sure you want to delete "${workTitle}"? This action cannot be undone.`)) {
            return;
        }
        
        try {
            const response = await fetch(`/api/works/${id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                // Remove from local arrays
                allWorks = allWorks.filter(w => w.id != id);
                applyFiltersAndSort();
                alert('Work successfully deleted!');
            } else {
                throw new Error('Failed to delete work');
            }
        } catch (error) {
            console.error(`Error deleting work ${id}:`, error);
            alert('Failed to delete work.');
        }
    };

    // Handle admin add form
    const adminForm = document.getElementById('admin-add-form');
    const adminStatus = document.getElementById('admin-status');
    const fileInput = document.getElementById('admin-file');
    const urlInput = document.getElementById('admin-url');
    const imageTypeRadios = document.querySelectorAll('input[name="image-type"]');
    
    // Toggle between file and URL input
    imageTypeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'file') {
                fileInput.style.display = 'block';
                fileInput.required = true;
                urlInput.style.display = 'none';
                urlInput.required = false;
            } else {
                fileInput.style.display = 'none';
                fileInput.required = false;
                urlInput.style.display = 'block';
                urlInput.required = true;
            }
        });
    });
    
    if (adminForm) {
        adminForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const title = document.getElementById('admin-title').value;
            const description = document.getElementById('admin-description').value;
            const imageType = document.querySelector('input[name="image-type"]:checked').value;
            
            let formData = new FormData();
            formData.append('title', title);
            formData.append('description', description);
            formData.append('admin-add', 'true');
            
            if (imageType === 'file') {
                const file = document.getElementById('admin-file').files[0];
                if (!file) {
                    showAdminStatus('Please select a file', 'error');
                    return;
                }
                formData.append('submission-file', file);
                formData.append('image-type', 'file');
            } else {
                const imageUrl = document.getElementById('admin-url').value;
                if (!imageUrl) {
                    showAdminStatus('Please enter an image URL', 'error');
                    return;
                }
                formData.append('image-url', imageUrl);
                formData.append('image-type', 'url');
            }
            
            try {
                const response = await fetch('/api/admin-add', {
                    method: 'POST',
                    body: formData
                });
                
                if (response.ok) {
                    const result = await response.json();
                    showAdminStatus('Work successfully added!', 'success');
                    adminForm.reset();
                    fetchWorks(); // Refresh the list
                } else {
                    throw new Error('Error adding work');
                }
            } catch (error) {
                console.error('Error adding work:', error);
                showAdminStatus('Failed to add work', 'error');
            }
        });
    }
    
    const showAdminStatus = (message, type) => {
        adminStatus.textContent = message;
        adminStatus.className = type;
        setTimeout(() => {
            adminStatus.style.display = 'none';
            adminStatus.className = '';
        }, 3000);
    };

    // Event listeners for filters and search
    statusFilter.addEventListener('change', applyFiltersAndSort);
    sortBy.addEventListener('change', applyFiltersAndSort);
    searchInput.addEventListener('input', debounce(applyFiltersAndSort, 300));
    
    // Debounce function for search input
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    fetchWorks(); // Initial load
});

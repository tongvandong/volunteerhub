export function getRegistrationFilters(registrations) {
  return [
    { key: 'all', 
      label: 'Tất cả', 
      count: registrations.length 
    },
    { key: 'Pending', 
      label: 'Chờ xác nhận', 
      count: registrations.filter((registration) => registration.status === 'Pending').length 
    },
    { key: 'Confirmed', 
      label: 'Đã xác nhận', 
      count: registrations.filter((registration) => registration.status === 'Confirmed' && !registration.isAttended).length 
    },
    { key: 'attended', 
      label: 'Đã tham gia', 
      count: registrations.filter((registration) => registration.isAttended).length 
    },
    { key: 'Cancelled', 
      label: 'Đã hủy', 
      count: registrations.filter((registration) => registration.status === 'Cancelled').length 
    },
  ];
}

export function getVisibleRegistrations(registrations, filter) {
  if (filter === 'all') {
    return registrations;
  }

  return registrations.filter((registration) => {
    if (filter === 'attended') {
      return registration.isAttended;
    }

    if (filter === 'Confirmed') {
      return registration.status === 'Confirmed' && !registration.isAttended;
    }

    return registration.status === filter;
  });
}

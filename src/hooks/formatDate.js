function formatDate(date = new Date()) {
    console.log('Input date:', date);

    // Asegurar que la fecha sea un objeto Date válido
    const dateToFormat = new Date(date);
    if (isNaN(dateToFormat.getTime())) {
        throw new Error('Invalid date format');
    }

    // Obtener día, mes y año
    const day = String(dateToFormat.getDate()).padStart(2, '0'); 
    const month = String(dateToFormat.getMonth() + 1).padStart(2, '0'); 
    const year = dateToFormat.getFullYear();

    const formattedDate = `${day}/${month}/${year}`;
    console.log('Formatted date:', formattedDate);

    return formattedDate;
}

module.exports = formatDate;
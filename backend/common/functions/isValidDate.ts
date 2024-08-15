export default function isValidDate(d: Date) {
    return d instanceof Date && !isNaN(+new Date(d));
}
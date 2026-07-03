const notImplemented = (req, res) => {
    res.status(501).json({ error: { message: "Not implemented yet", code: "NOT_IMPLEMENTED" } });
};

module.exports = {
    createTeam: notImplemented,
    getTeam: notImplemented,
    listMembers: notImplemented,
    addMember: notImplemented,
    updateMemberRole: notImplemented,
    removeMember: notImplemented,
};
export class PrivacyController {
    privacyService;
    constructor(privacyService) {
        this.privacyService = privacyService;
    }
    getSettingsHandler = async (request, reply) => {
        const userId = request.user.sub;
        return this.privacyService.getSettings(userId);
    };
    updateSettingsHandler = async (request, reply) => {
        const userId = request.user.sub;
        // Handle exactOptionalPropertyTypes: true by stripping undefined values
        const data = Object.fromEntries(Object.entries(request.body).filter(([_, v]) => v !== undefined));
        return this.privacyService.updateSettings(userId, data);
    };
}
//# sourceMappingURL=privacy.controller.js.map
from app.repositories import competition_crud
from app.services.unify.function import find_original_sentence
from app.models.competition import Competition, Report_File

def get_competition_application_link_via_en_name(name: str):
    competition_crud_class = competition_crud.CompetitionCRUD()
    competition_obj = competition_crud_class.get_competition_by_en_name(name)
    if competition_obj is None:
        return None
    return competition_obj.application_link

def get_competition_obj_via_any_name(name: str):
    competition_crud_class = competition_crud.CompetitionCRUD()
    unified_name = find_original_sentence(name)
    competition_obj = competition_crud_class.get_competition_by_en_name(name=unified_name)
    if not competition_obj:
        competition_obj = competition_crud_class.get_competition_by_en_link(en_link=unified_name)
        if not competition_obj:
            competition_obj = competition_crud_class.get_competition_by_tr_name(name=name)
            if not competition_obj:
                competition_obj = competition_crud_class.get_competition_by_en_name(name=name)
                if not competition_obj:
                    competition_obj = competition_crud_class.get_competition_by_ar_name(name=name)
                    if not competition_obj:
                        return None
    return competition_obj

def update_or_create_competition(
        link = None,
        image_link = None,
        tk_number = None,
        t3kys_number = None,
        application_link = None,
        comp_name = None,
        comp_description = None,
        comp_link = None,
        year = None,
        min_member = None,
        max_member = None,
        lang = None
):
    print(f"""
            received competition info:
            link: {link}
            image_link: {image_link}
            tk_number: {tk_number}
            t3kys_number: {t3kys_number}
            application_link: {application_link}
            comp_name: {comp_name}
            comp_description: {comp_description}
            comp_link: {comp_link}
            year: {year}
            min_member: {min_member}
            max_member: {max_member}
            lang: {lang}
        """)
    
    competition_obj_new: Competition = Competition()

    competition_obj_from_db = get_competition_obj_via_any_name(comp_name)
    competition_crud_class = competition_crud.CompetitionCRUD()
    if competition_obj_from_db:
        competition_obj_new = competition_obj_from_db


    if lang == "tr" or "teknofest.org/tr" in link:
        lang = "tr"
        competition_obj_new.application_link_tr = application_link
        competition_obj_new.tr_name = comp_name
        competition_obj_new.tr_description = comp_description
        competition_obj_new.tr_link = comp_link
    elif lang == "en" or "teknofest.org/en" in link:
        lang = "en"
        competition_obj_new.application_link_en = application_link
        competition_obj_new.en_name = comp_name
        competition_obj_new.en_description = comp_description
        competition_obj_new.en_link = comp_link
    else:
        lang = "ar"
        competition_obj_new.application_link_ar = application_link
        competition_obj_new.ar_name = comp_name
        competition_obj_new.ar_description = comp_description
        competition_obj_new.ar_link = comp_link


    if competition_obj_from_db:  # update existing competition
        if image_link:
            competition_obj_new.image_path = image_link
        if tk_number:
            competition_obj_new.tk_number = tk_number
        if t3kys_number:
            competition_obj_new.t3kys_number = t3kys_number
        if year not in competition_obj_new.years:
            competition_obj_new.years.append(year)
        if min_member:
            competition_obj_new.min_member = min_member
        if max_member:
            competition_obj_new.max_member = max_member

        competition_crud_class.update_competition(competition_obj_from_db.id, competition_obj_new)

    else:  # create new competition
        competition_obj_new.image_path=image_link
        competition_obj_new.tk_number=tk_number
        competition_obj_new.t3kys_number=t3kys_number
        competition_obj_new.years=[year]
        competition_obj_new.min_member=min_member
        competition_obj_new.max_member=max_member

        competition_crud_class.create_competition(competition_obj_new)


    return competition_obj_new


def update_or_create_report_file(
        comp_name = None,
        team_id = None,
        year = None,
        file_path = None,
        rank = None,
        stage = None,
        language = None
):
    print(f"""
            received report file info:
            comp_name: {comp_name}
            team_id: {team_id}
            year: {year}
            file_path: {file_path}
            rank: {rank}
            stage: {stage}
    """)

    # create new report file object
    report_file_crud_class = competition_crud.ReportFileCRUD()
    report_file_obj_new: Report_File = Report_File()
    
    # get competition object
    competition_obj_from_db = get_competition_obj_via_any_name(comp_name)
    competition_crud_class = competition_crud.CompetitionCRUD()
    if competition_obj_from_db:
        competition_id = competition_obj_from_db.id
    else:
        return

    try:
        report_file_obj_from_db = report_file_crud_class.get_report_files_by_competition_id_and_team_id(file_path)[0]
        if report_file_obj_from_db:
            report_file_obj_new = report_file_obj_from_db
    except:
        pass

    # update or create report file
    if competition_id:
        report_file_obj_new.competition_id = competition_id
    if team_id:
        report_file_obj_new.team_id = team_id
    if year:
        report_file_obj_new.year = year
    if file_path:
        report_file_obj_new.file_path = file_path
    if rank:
        report_file_obj_new.rank = rank
    if stage:
        report_file_obj_new.stage = stage
    if language:
        report_file_obj_new.language = language

    report_file_crud_class.update_report_file(report_file_obj_new.id, report_file_obj_new)

    return report_file_obj_new

